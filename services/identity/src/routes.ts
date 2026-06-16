import type { FastifyInstance } from "fastify";
import { sql } from "./db";
import { writeEvent } from "./outbox";

/**
 * The stream-lifecycle endpoints — the payoff of the whole epic. Each handler
 * does the state change AND stages the domain event in ONE Postgres transaction,
 * then returns. It never talks to Kafka: the relay (relay.ts) drains the outbox
 * asynchronously. That split is the point — the request path is decoupled from
 * the event-delivery path, so a slow or down Kafka can't slow or fail go-live.
 *
 * Note the shape every handler follows: the `sql.begin` callback returns a
 * discriminated outcome (`{ found: false }` | `{ found: true, … }`) rather than
 * calling `reply` inside the transaction. Reasons:
 *  - `reply` must run *after* the transaction resolves — sending HTTP 200 before
 *    COMMIT is durable would be a lie if the commit then fails.
 *  - keeping I/O (the HTTP write) out of the transaction keeps the tx — and any
 *    row locks it holds — as short as possible.
 * So we compute "what happened" inside the tx and translate it to a status code
 * once, outside.
 */

/**
 * The partial unique index `one_active_stream_per_channel` raises a 23505 when a
 * second concurrent go-live tries to open a stream on a live channel. We catch
 * it by name and translate to 409 — the database is the arbiter, not the app.
 */
const isUniqueViolation = (error: unknown, constraint: string): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "23505" &&
  "constraint_name" in error &&
  error.constraint_name === constraint;

interface SlugParams {
  slug: string;
}

export const registerStreamRoutes = (app: FastifyInstance): void => {
  app.post<{ Params: SlugParams }>(
    "/channels/:slug/go-live",
    async (request, reply) => {
      const { slug } = request.params;

      try {
        const outcome = await sql.begin(async (tx) => {
          const [channel] = await tx<{ id: string }[]>`
            SELECT id FROM channels WHERE slug = ${slug}
          `;

          if (!channel) {
            return { found: false as const };
          }

          const title = `Live: ${slug}`;

          /**
           * No check-then-insert "is it already live?" guard here — that race
           * (two POSTs both reading "not live", both inserting) is exactly what
           * the `one_active_stream_per_channel` partial unique index prevents.
           * We just insert optimistically; if a concurrent go-live already
           * opened a stream, the index raises 23505 and the catch below turns it
           * into 409. The database is the single arbiter of the invariant.
           */
          const [stream] = await tx<{ id: string; startedAt: Date }[]>`
            INSERT INTO streams (channel_id, title)
            VALUES (${channel.id}, ${title})
            RETURNING id, started_at
          `;

          await tx`UPDATE channels SET is_live = true WHERE id = ${channel.id}`;

          await writeEvent(tx, {
            aggregateType: "stream",
            aggregateId: stream.id,
            eventType: "StreamStarted",
            partitionKey: channel.id,
            payload: {
              streamId: stream.id,
              channelId: channel.id,
              channelSlug: slug,
              startedAt: stream.startedAt.getTime(),
              title,
            },
          });

          return { found: true as const, streamId: stream.id };
        });

        if (!outcome.found) {
          return reply.code(404).send({ error: "channel not found" });
        }

        return reply.code(200).send({ streamId: outcome.streamId });
      } catch (error) {
        if (isUniqueViolation(error, "one_active_stream_per_channel")) {
          return reply.code(409).send({ error: "channel is already live" });
        }

        throw error;
      }
    }
  );

  app.post<{ Params: SlugParams }>(
    "/channels/:slug/end-stream",
    async (request, reply) => {
      const { slug } = request.params;

      const outcome = await sql.begin(async (tx) => {
        const [channel] = await tx<{ id: string }[]>`
          SELECT id FROM channels WHERE slug = ${slug}
        `;

        if (!channel) {
          return { found: false as const };
        }

        /**
         * The `ended_at IS NULL` predicate is both the target selector and the
         * idempotency guard: it matches only the *active* stream, so a second
         * end-stream on an already-ended channel updates zero rows and returns
         * no row — which we map to 409 below. No separate "is it live?" read.
         */
        const [stream] = await tx<{ id: string; endedAt: Date }[]>`
          UPDATE streams
          SET ended_at = now()
          WHERE channel_id = ${channel.id} AND ended_at IS NULL
          RETURNING id, ended_at
        `;

        if (!stream) {
          return { found: true as const, live: false as const };
        }

        await tx`UPDATE channels SET is_live = false WHERE id = ${channel.id}`;

        await writeEvent(tx, {
          aggregateType: "stream",
          aggregateId: stream.id,
          eventType: "StreamEnded",
          partitionKey: channel.id,
          payload: {
            streamId: stream.id,
            channelId: channel.id,
            channelSlug: slug,
            endedAt: stream.endedAt.getTime(),
            reason: "NORMAL",
          },
        });

        return {
          found: true as const,
          live: true as const,
          streamId: stream.id,
        };
      });

      if (!outcome.found) {
        return reply.code(404).send({ error: "channel not found" });
      }

      if (!outcome.live) {
        return reply.code(409).send({ error: "channel is not live" });
      }

      return reply.code(200).send({ streamId: outcome.streamId });
    }
  );
};
