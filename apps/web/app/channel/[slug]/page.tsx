"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type SubmitEvent, use, useEffect, useRef, useState } from "react";
import { useChatSocket } from "@/lib/use-chat-socket";
import { useTRPC } from "@/trpc/client";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function ChannelPage({ params }: Props) {
  const { slug } = use(params);
  const trpc = useTRPC();
  const channel = useQuery(trpc.channel.get.queryOptions({ slug }));

  /**
   * The viewer poll. React Query owns the 5s timer, dedupes, and keeps the last
   * value while refetching. Keyed by streamId (present only when live), so the
   * `enabled` gate stops it dead on offline channels — no streamId, no requests.
   */
  const streamId = channel.data?.streamId;
  const viewers = useQuery(
    trpc.channel.viewers.queryOptions(
      { streamId: streamId ?? "" }, // never runs with "" — enabled is false then
      {
        enabled: Boolean(streamId),
        refetchInterval: 5000, // the entire "poll every 5s"
        placeholderData: keepPreviousData, // keep last count across ticks / 503s
      }
    )
  );

  // Hooks run unconditionally, above the early returns. The socket gates on `enabled`.
  const { messages, send } = useChatSocket(slug, channel.data?.isLive ?? false);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Pin the transcript to the bottom whenever it grows.
  useEffect(() => {
    if (messages.length) {
      listRef.current?.scrollTo(0, listRef.current.scrollHeight);
    }
  }, [messages]);

  if (channel.isPending) {
    return <p>Loading...</p>;
  }

  if (channel.error) {
    return <p>Channel not found.</p>;
  }

  const { title, isLive } = channel.data;

  const doSend = () => {
    send(draft);
    setDraft("");
  };

  const onSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    doSend();
  };

  return (
    <main style={{ display: "flex", gap: 16, height: "100vh", padding: 16 }}>
      <section style={{ flex: 1, minWidth: 0 }}>
        {/*
         * The player "stage": a 16:9 black box that fills its column.
         * `aspect-ratio` is native CSS — the browser derives the height from
         * the width, so the box reserves its space before paint (no layout
         * shift). `position: relative` makes it the anchor for the badge.
         */}
        <div
          style={{
            position: "relative",
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

          {isLive && (
            <span
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 600,
                color: "white",
                background: "rgba(0, 0, 0, 0.6)",
              }}
            >
              {viewers.data?.count ?? "—"}
            </span>
          )}
        </div>
        <h1>{title}</h1>
      </section>

      <aside
        style={{
          width: 320,
          display: "flex",
          flexDirection: "column",
          border: "1px solid #333",
          borderRadius: 8,
        }}
      >
        <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {messages.map((m) => (
            <p
              key={m.id}
              style={{
                margin: "4px 0",
                textAlign: m.own ? "right" : "left",
                color: m.own ? "#4ea1ff" : "inherit",
              }}
            >
              {m.body}
            </p>
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          style={{ display: "flex", gap: 8, padding: 12 }}
        >
          <textarea
            aria-label="Chat message"
            disabled={!isLive}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doSend();
              }
            }}
            rows={2}
            style={{ flex: 1, resize: "none" }}
            value={draft}
          />
          <button disabled={!isLive} type="submit">
            Send
          </button>
        </form>
      </aside>
    </main>
  );
}
