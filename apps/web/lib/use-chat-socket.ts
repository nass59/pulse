"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CHAT_WS_URL =
  process.env.NEXT_PUBLIC_CHAT_WS_URL ?? "ws://localhost:8081";

export type ChatMessage = {
  id: string; // client-local, for React keys only — NOT the server's messageId
  body: string;
  own: boolean; // incoming frames carry no author, so incoming is always false
};

const NOT_LIVE = 1008; // StatusPolicyViolation — channel isn't live
const STREAM_ENDED = 1001; // StatusGoingAway — stream ended, force-closed

/**
 * Owns the chat socket for one channel. `enabled` gates on liveness: an offline
 * channel just 1008s us, so we don't dial until channel.get reports isLive.
 */
export const useChatSocket = (slug: string, enabled: boolean) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const connect = () => {
      const ws = new WebSocket(`${CHAT_WS_URL}/ws/${slug}`);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0; // a good connection resets the backoff
      };

      ws.onmessage = (e) => {
        // Plain text: the frame IS the body. No JSON.parse, no author, no time.
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), body: e.data as string, own: false },
        ]);
      };

      ws.onclose = (e) => {
        /**
         * Identity guard: if a newer socket has replaced this one (a reconnect,
         * or StrictMode's mount→unmount→mount in dev), this stale onclose must
         * do nothing — otherwise it reconnects a socket we already abandoned.
         * This single check replaces the fragile "closedByUs" flag.
         */
        if (wsRef.current !== ws) {
          return;
        }

        // 1008/1001 are the server saying "leave" — retrying just gets rejected.
        if (e.code === NOT_LIVE || e.code === STREAM_ENDED) {
          return;
        }

        const delay = Math.min(1000 * 2 ** retryRef.current, 30_000);
        retryRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      /**
       * Null the ref FIRST: close() fires onclose asynchronously, and by then
       * this socket is no longer "current", so the identity guard short-circuits
       * it. That's what makes unmount + StrictMode leak-free without a flag.
       */
      const ws = wsRef.current;
      wsRef.current = null;
      clearTimeout(timerRef.current);
      ws?.close();
    };
  }, [slug, enabled]);

  const send = useCallback((body: string) => {
    const text = body.trim();

    if (!text || wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(text); // raw string, not JSON — matches the gateway's string(data)

    // Gateway skips the sender in broadcast, so echo locally with no dedupe.
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), body: text, own: true },
    ]);
  }, []);

  return { messages, send };
};
