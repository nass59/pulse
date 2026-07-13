"use client";

import { ArrowRight, Play, User } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { EASE_OUT_STRONG } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A faithful miniature of apps/web's channel page — live badge, video pane,
 * chat feed, viewer count, message box. It is the product appearing on the
 * homepage as *evidence inside the loop*, never as a product pitch
 * (CONTRACT.md: architecture-first, product-as-evidence).
 *
 * Controlled (pass `messages`/`viewers`) or self-driving (pass neither and it
 * quietly simulates a live channel while in view). `interactive` renders a
 * working input; `onSend` receives the visitor's message — the payload the
 * ride below follows.
 */
export type ChatMessage = {
  /** Stable identity for list rendering; falls back to user+text. */
  id?: number;
  text: string;
  user: string;
};

const USERS = ["mika", "jo_", "ren", "ava", "sam", "kd", "nova", "lex"];
const LINES = [
  "let's gooo",
  "POG",
  "first!",
  "GGWP",
  "no wayyy",
  "clip that",
  "W stream",
];

/**
 * Deterministic seed so server and client render the same first frame —
 * randomness only ever runs inside effects (the log-tape hydration lesson).
 */
const SEED_MESSAGES: ChatMessage[] = [
  { user: "ren", text: "POG" },
  { user: "ava", text: "clip that" },
  { user: "jo_", text: "W stream" },
];

let nextMessageId = SEED_MESSAGES.length;

const randomMessage = (): ChatMessage => ({
  id: nextMessageId++,
  user: USERS[Math.floor(Math.random() * USERS.length)],
  text: LINES[Math.floor(Math.random() * LINES.length)],
});

export const MiniChannelApp = ({
  className,
  flash = false,
  interactive = false,
  messages,
  onSend,
  viewers,
}: {
  className?: string;
  /** Pulse the viewer badge — the windowed count just came home. */
  flash?: boolean;
  interactive?: boolean;
  messages?: ChatMessage[];
  onSend?: (text: string) => void;
  viewers?: number;
}) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });
  const controlled = messages !== undefined;

  const [selfMessages, setSelfMessages] = useState(SEED_MESSAGES);
  const [selfViewers, setSelfViewers] = useState(1284);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (controlled || reduce || !inView) {
      return;
    }
    const id = setInterval(() => {
      setSelfMessages((m) => [...m.slice(-4), randomMessage()]);
      if (Math.random() > 0.6) {
        setSelfViewers((v) => v + Math.floor(Math.random() * 3) - 1);
      }
    }, 1600);
    return () => clearInterval(id);
  }, [controlled, reduce, inView]);

  const shown = controlled ? messages : selfMessages;
  const count = viewers ?? selfViewers;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }
    setDraft("");
    /**
     * The visitor's message lands in the feed like any other chat line — the
     * miniature is evidence, and evidence that swallows your input is a lie.
     */
    setSelfMessages((m) => [
      ...m.slice(-4),
      { id: nextMessageId++, user: "you", text },
    ]);
    onSend?.(text);
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-carbon-850 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]",
        className
      )}
      ref={ref}
    >
      {/* header — live badge · channel · viewer count */}
      <div className="flex items-center gap-2 border-white/10 border-b px-2.5 py-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] text-red-400 tracking-[0.12em]">
          <span
            className={cn(
              "size-1.5 rounded-full bg-red-400",
              !reduce && "animate-pulse"
            )}
          />
          LIVE
        </span>
        <span className="font-mono text-[10px] text-white/60">
          pulse.tv/<b className="font-semibold text-white">nass</b>
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-pill border border-white/10 px-2 py-0.5 text-[10px] text-white/70 transition-[border-color,color,box-shadow] duration-500",
            flash &&
              "border-kotlin-purple text-kotlin-purple shadow-glow-kotlin-sm duration-150"
          )}
        >
          <User className="size-2.5" />
          <b className="font-semibold tabular-nums">{count.toLocaleString()}</b>
        </span>
      </div>

      {/* video pane — the media plane placeholder */}
      <div
        aria-hidden
        className="grid aspect-[16/7.5] place-items-center bg-[radial-gradient(120%_140%_at_20%_0%,color-mix(in_oklab,var(--color-electric-yellow)_12%,transparent),transparent_55%),linear-gradient(150deg,#1d1d16,#0c0c0a)]"
      >
        <span className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm">
          <Play className="size-3.5 fill-current" />
        </span>
      </div>

      {/* chat feed */}
      <div className="flex min-h-24 flex-col justify-end gap-1.5 px-2.5 py-2">
        {shown.slice(-5).map((message) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-white/75 leading-snug"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            key={message.id ?? `${message.user}-${message.text}`}
            /** rows glide up when the oldest message drops, instead of teleporting */
            layout={!reduce}
            transition={{ duration: 0.25, ease: EASE_OUT_STRONG }}
          >
            <b className="mr-1 font-semibold text-electric-yellow">
              {message.user}
            </b>
            {message.text}
          </motion.div>
        ))}
      </div>

      {/* message box */}
      {interactive ? (
        <form
          className="flex gap-1.5 border-white/10 border-t px-2.5 py-2"
          onSubmit={submit}
        >
          <input
            aria-label="chat message"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white outline-none transition-colors placeholder:text-white/35 focus:border-electric-yellow"
            maxLength={48}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Send a message…"
            value={draft}
          />
          <button
            aria-label="send message"
            className="grid w-7 place-items-center rounded-lg bg-electric-yellow text-yellow-ink transition-transform active:scale-95"
            type="submit"
          >
            <ArrowRight className="size-3" />
          </button>
        </form>
      ) : (
        <div className="border-white/10 border-t px-2.5 py-2">
          <span className="block rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/35">
            Send a message…
          </span>
        </div>
      )}
    </div>
  );
};
