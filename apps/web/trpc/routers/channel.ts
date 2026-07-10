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
});
