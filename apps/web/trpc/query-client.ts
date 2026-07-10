import { QueryClient } from "@tanstack/react-query";

/**
 * ponytail: dropped the doc's `dehydrate` option — it only matters for server
 * prefetch/hydration, which the MVP skips (client-only, ADR-0023). Add it back
 * the day you introduce a trpc/server.tsx prefetch.
 */
export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { staleTime: 30 * 1000 } },
  });
