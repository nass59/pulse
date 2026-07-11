import { TRPCError } from "@trpc/server";
import z from "zod";
import { baseProcedure, createTRPCRouter } from "../init";

/**
 * identity's base URL is injected, not hardcoded — the BFF's fetch target is
 * dev-loop config (ADR-0023). This module runs server-side only and never ships
 * to the browser, so reading process.env here is safe.
 */
const IDENTITY_URL = process.env.IDENTITY_URL ?? "http://localhost:3100";

/**
 * analytics' base URL — same dev-loop config treatment as IDENTITY_URL.
 */
const ANALYTICS_URL = process.env.ANALYTICS_URL ?? "http://localhost:8082";

/**
 * The shape the page owns. Deriving the TS type from the zod schema (z.infer)
 * means the runtime parse and the compile-time type can't drift — one source.
 * It happens to match identity's response today; if identity's payload changes,
 * THIS is the seam where we adapt and the client never notices.
 */
const ChannelViewSchema = z.object({
  slug: z.string(),
  title: z.string(),
  isLive: z.boolean(),
  streamId: z.string().optional(),
});

export type ChannelView = z.infer<typeof ChannelViewSchema>;

/**
 * analytics' body for GET /streams/:id/viewers. Parse the WHOLE thing at the
 * boundary — even windowEnd, which the page never reads — so a contract drift
 * fails loudly here instead of rendering `undefined`. windowEnd is null when
 * count is 0 (no elapsed window for this stream).
 */
const ViewerCountSchema = z.object({
  streamId: z.string(),
  count: z.number(),
  windowEnd: z.string().nullable(),
});

export const channelRouter = createTRPCRouter({
  get: baseProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }): Promise<ChannelView> => {
      /**
       * Server-to-server fetch: no CORS, no rewrites. This crosses tRPC's type
       * boundary — identity's body arrives as `unknown`. A 404 (unknown slug)
       * becomes a tRPC NOT_FOUND the client can branch on; anything else non-2xx
       * is a BAD_GATEWAY (identity is up but misbehaving).
       */
      const res = await fetch(
        `${IDENTITY_URL}/channels/${encodeURIComponent(input.slug)}`
      );

      if (res.status === 404) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "channel not found",
        });
      }

      if (!res.ok) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `identity responded ${res.status}`,
        });
      }

      // Parse identity's contract at the boundary — the one place to be strict.
      return ChannelViewSchema.parse(await res.json());
    }),

  /**
   * The polled mirror of `get`: same server-side fetch shape, but the page hits
   * it every 5s. Keyed by streamId (the count store is streamId-keyed, not
   * slug), so the page chains get -> viewers, only while the channel is live.
   */
  viewers: baseProcedure
    .input(z.object({ streamId: z.uuid() }))
    .query(async ({ input }): Promise<{ count: number }> => {
      const res = await fetch(
        `${ANALYTICS_URL}/streams/${input.streamId}/viewers`
      );

      /**
       * 503 = Kafka Streams topology REBALANCING / state store momentarily
       * unavailable (ADR-0022). "Ask again in a second," not "broken" — throw a
       * retryable error and let React Query's interval pick it up while the
       * client keeps the last good count. Mapping this to 0 would fabricate
       * "zero viewers" out of "warming up."
       */
      if (res.status === 503) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "analytics warming up",
        });
      }

      if (!res.ok) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `analytics responded ${res.status}`,
        });
      }

      /**
       * 200 always carries a count — including unknown streamIds, which read as
       * 0 by design (absence is 0, never 404). We forward only `count`.
       */
      const { count } = ViewerCountSchema.parse(await res.json());

      return { count };
    }),
});
