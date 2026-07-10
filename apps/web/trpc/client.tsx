"use client";

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import { makeQueryClient } from "@/trpc/query-client";
import type { AppRouter } from "@/trpc/routers/_app";

// The typed hooks. `useTRPC()` returns the proxy you build queryOptions from.
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

/**
 * One QueryClient per browser tab, but a fresh one per server render. The
 * `typeof window` guard is the standard Next pattern — sharing a client across
 * requests on the server would leak one user's cache into another's.
 */
const getQueryClient = () => {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();

  return browserQueryClient;
};

// Absolute URL server-side, relative in the browser.
const getUrl = () => {
  const base = typeof window === "undefined" ? "http://localhost:3000" : "";

  return `${base}/api/trpc`;
};

export const TRPCReactProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: getUrl() })],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
};
