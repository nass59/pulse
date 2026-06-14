import { EVENT_TOPICS } from "@pulse/schemas/topics";
import type { FastifyInstance } from "fastify";
import { sql } from "./db";
import { writeEvent } from "./outbox";

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
            topic: EVENT_TOPICS.StreamStarted,
            partitionKey: channel.id,
            payload: {
              streamId: stream.id,
              channelId: channel.id,
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
          topic: EVENT_TOPICS.StreamEnded,
          partitionKey: channel.id,
          payload: {
            streamId: stream.id,
            channelId: channel.id,
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
