import { createTRPCRouter } from "../init";
import { channelRouter } from "./channel";

// The single root router. Add future routers (chat, presence) as siblings here.
export const appRouter = createTRPCRouter({
  channel: channelRouter,
});

// The type — NOT the value — is what flows to the client for end-to-end safety.
export type AppRouter = typeof appRouter;
