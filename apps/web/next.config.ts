import type { NextConfig } from "next";

/**
 * Deliberately minimal — and deliberately NOT `output: "export"` (which
 * apps/docs uses). This app has a live server route, app/api/trpc/[trpc]/route.ts,
 * the tRPC fetch handler; a static export would drop it and the BFF would 404.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
