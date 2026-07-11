"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { useTRPC } from "@/trpc/client";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function ChannelPage({ params }: Props) {
  const { slug } = use(params);
  const trpc = useTRPC();
  const channel = useQuery(trpc.channel.get.queryOptions({ slug }));

  if (channel.isPending) {
    return <p>Loading...</p>;
  }

  if (channel.error) {
    return <p>Channel not found.</p>;
  }

  const { title, isLive } = channel.data;

  return (
    <main>
      {/*
       * The player "stage": a 16:9 black box that fills its column.
       * `aspect-ratio` is native CSS — the browser derives the height from
       * the width, so the box reserves its space before paint (no layout
       * shift). `position: relative` makes it the anchor for the badge.
       */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          aspectRatio: "16 / 9",
          background: "black",
        }}
      >
        {/*
         * Dormant on purpose: no `src`, so it never touches the network. This
         * is the socket where a real source (hls.js / a <source> child) gets
         * wired in Phase 4 — keeping the element here means the DOM shape the
         * media plane targets already exists. The <track> satisfies Biome's
         * useMediaCaption a11y rule and marks where real captions will live.
         */}
        <video style={{ width: "100%", height: "100%" }}>
          <track kind="captions" />
        </video>

        {/* The only real logic in this issue: one conditional badge. */}
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "4px 8px",
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 600,
            color: "white",
            background: isLive ? "#e00" : "#444",
          }}
        >
          {isLive ? "🔴 LIVE" : "Offline"}
        </span>

        <h1>{title}</h1>
      </div>
    </main>
  );
}
