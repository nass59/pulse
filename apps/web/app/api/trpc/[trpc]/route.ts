import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

/**
 * The one HTTP endpoint the BFF exposes. Note the imports use the `@/` alias —
 * the doc's example has broken relative paths (`./trpc/init` from inside
 * app/api/trpc/[trpc]/ would resolve wrong). GET serves queries, POST mutations.
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  });

export { handler as GET, handler as POST };
