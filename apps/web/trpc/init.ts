import { initTRPC } from "@trpc/server";

/**
 * No auth/session in the MVP — the context is empty. But the seam exists: when
 * Phase 2 adds a viewer identity, it goes here and every procedure sees it.
 */
export const createTRPCContext = async (_opts: { headers: Headers }) => ({});

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create();

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
