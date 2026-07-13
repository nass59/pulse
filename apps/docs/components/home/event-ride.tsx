"use client";

import { IconCheck } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";

import {
  type ChatMessage,
  MiniChannelApp,
} from "@/components/home/mini-channel-app";
import { RotatingWord } from "@/components/home/rotating-word";
import { EASE_OUT_STRONG } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The homepage centrepiece — "You Are The Event". The visitor types a chat
 * message in the hero's miniature channel page; the scroll journey then
 * follows THAT payload through the real pipeline, step by step: socket → Go →
 * the log → the consumers → back to their own screen. A sticky inspector
 * shows the payload exactly as each step sees it.
 *
 * Honesty rules (CONTRACT.md): every service, topic, and config named here is
 * the shipped Phase-1 system — only the pacing is art-directed, and the
 * visitor's message never leaves the page. Step tracking is an
 * IntersectionObserver over a viewport-centre band (never a scroll listener —
 * those fight smooth anchor scrolling).
 */
const DEFAULT_TEXT = "let's gooo";

type Accent = "go" | "kafka" | "kotlin" | "ts";

/** Literal class strings per accent — Tailwind can't see concatenations. */
const ACCENTS: Record<
  Accent,
  { bar: string; chip: string; dot: string; eyebrow: string; pill: string }
> = {
  ts: {
    eyebrow: "text-accent-blue",
    dot: "bg-accent-blue shadow-[0_0_12px_var(--color-accent-blue)]",
    pill: "bg-accent-blue text-white",
    bar: "bg-accent-blue",
    chip: "border-accent-blue/30",
  },
  go: {
    eyebrow: "text-go-blue",
    dot: "bg-go-blue shadow-glow-go-sm",
    pill: "bg-go-blue text-go-ink",
    bar: "bg-go-blue",
    chip: "border-go-blue/30",
  },
  kafka: {
    eyebrow: "text-electric-yellow",
    dot: "bg-electric-yellow shadow-glow-sm",
    pill: "bg-electric-yellow text-yellow-ink",
    bar: "bg-electric-yellow",
    chip: "border-electric-yellow/30",
  },
  kotlin: {
    eyebrow: "text-kotlin-purple",
    dot: "bg-kotlin-purple shadow-glow-kotlin-sm",
    pill: "bg-kotlin-purple text-white",
    bar: "bg-kotlin-purple",
    chip: "border-kotlin-purple/30",
  },
};

type Stage = {
  accent: Accent;
  body: ReactNode;
  code: string | null;
  id: string;
  meta: string[];
  place: string;
  step: string;
  title: string;
};

const buildStages = (rawText: string): Stage[] => {
  const text = rawText.replace(/"/g, "'");
  return [
    {
      id: "step-1",
      step: "step 1",
      accent: "ts",
      place: "your browser",
      title: "You hit send.",
      body: "No HTTP POST, no queue in front — the channel page already holds an open WebSocket to the chat gateway. Your message rides a socket you were given when the page loaded.",
      meta: ["transport · WebSocket", "apps/web · channel page"],
      code: `⇡ ws frame\n{\n  "channelSlug": "nass",\n  "text": "${text}"\n}`,
    },
    {
      id: "step-2",
      step: "step 2",
      accent: "go",
      place: "services/chat · Go",
      title: "A goroutine picks you up.",
      body: (
        <>
          One goroutine per connection — yours included. The gateway stamps
          identity and time, then Avro-encodes the message against the
          registered <code className="text-go-blue">ChatMessage</code> schema.
          If that encoding fails, the error is a value, handled right there.
        </>
      ),
      meta: [
        "goroutine per socket",
        "Avro · Schema Registry",
        "BACKWARD compatible",
      ],
      code: `ChatMessage (Avro)\n{\n  "messageId": "8c2e…",\n  "channelSlug": "nass",\n  "userId": "you",\n  "text": "${text}",\n  "sentAt": 1752307200412\n}`,
    },
    {
      id: "step-3",
      step: "step 3",
      accent: "kafka",
      place: "Kafka · the log",
      title: "You become history.",
      body: (
        <>
          Produced to{" "}
          <code className="text-electric-yellow">chat.messages.v1</code>, keyed
          by channel —{" "}
          <code className="text-electric-yellow">murmur2("nass")</code> picks
          your partition, the same math in every producer language. Appended,
          never edited: from this moment your message is an immutable record
          anyone can re-read.
        </>
      ),
      meta: [
        "topic · chat.messages.v1",
        "key · murmur2(channel)",
        "append-only",
      ],
      code: `chat.messages.v1\npartition 1 · offset 48,231\n─────────────────────────\n48,229  ren   "POG"\n48,230  ava   "clip that"\n48,231  you   "${text}"  ◂ you`,
    },
    {
      id: "step-4",
      step: "step 4",
      accent: "kotlin",
      place: "the consumers",
      title: "Everyone reads you — differently.",
      body: "The gateway's consumer (a fresh group per boot — it wants the live tail, not history) reads you back and fans you out to every open tab. Meanwhile analytics is windowing the presence stream next door: 60 seconds of horizon, hopping every 10.",
      meta: [
        "group · chat-gateway-<host>-<uuid>",
        "fan-out · best-effort (the log is what's durable)",
        "analytics · 60s window · 10s hop",
      ],
      code: "consumers of the log\n├─ chat-gateway-*   ▸ fan-out to tabs\n└─ analytics        ▸ windowed counts\n     emits analytics.viewer-count.v1",
    },
    {
      id: "step-5",
      step: "step 5",
      accent: "kafka",
      place: "every screen",
      title: "…and you're back.",
      body: "Your message lands on every open tab — including this one — and the viewer count ticks a moment later when the next window closes and the BFF poll brings it home. One log. Many readers. That's the whole architecture, and you just rode it.",
      meta: ["round trip complete", "GET /viewer-count"],
      code: null,
    },
  ];
};

const STAGE_IDS = ["step-1", "step-2", "step-3", "step-4", "step-5"];

/**
 * One-time cinematic entrance per ride step: the parent staggers, each child
 * rises. Sections re-render on every keystroke/step change, so the reveal is
 * `viewport.once` — it plays exactly once per step, on first scroll into view.
 */
const STEP_GROUP = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const RISE = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_STRONG },
  },
};

/** Plain-language facts an outsider parses with zero context — the belt. */
const TICKER_ITEMS = [
  "a real Twitch-style app — and it runs",
  "three languages: TypeScript · Go · Kotlin",
  "every chat message rides a Kafka log",
  "the viewer count is stream processing, not a database counter",
  "every decision written down — 23 architecture decision records",
  "built in public, one phase at a time",
  "open source on GitHub",
];

const Ticker = () => (
  /**
   * Sticky under the 65px header (z below its z-40) — the belt of plain-fact
   * claims rides along for the whole page. The translucent carbon backdrop
   * keeps ride content from bleeding through; the edge-fade mask lives on the
   * inner wrapper so the backdrop itself doesn't fade.
   */
  <div
    aria-hidden
    className="sticky top-[65px] z-30 border-electric-yellow/15 border-y bg-carbon-900/85 backdrop-blur-md"
  >
    <div className="overflow-hidden bg-electric-yellow/[0.02] [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-ticker-belt gap-10 py-2.5 motion-reduce:animate-none">
        {(["a", "b"] as const).flatMap((copy) =>
          TICKER_ITEMS.map((item, i) => (
            <span
              className={cn(
                "whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.12em]",
                i % 2 === 0 ? "text-electric-yellow/55" : "text-white/45"
              )}
              key={`${copy}-${item}`}
            >
              {item}
            </span>
          ))
        )}
      </div>
    </div>
  </div>
);

export const EventRide = () => {
  const reduce = useReducedMotion();
  const [text, setText] = useState(DEFAULT_TEXT);
  const [sent, setSent] = useState(false);
  const [active, setActive] = useState(0);
  const stages = buildStages(text);

  /**
   * Which step owns the viewport centre. Observes the static STAGE_IDS, so
   * the observer never needs rebuilding when the typed payload changes.
   */
  useEffect(() => {
    const elements = STAGE_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.idx));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    for (const el of elements) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const stage = stages[active];
  const accent = ACCENTS[stage.accent];
  const finalMessages: ChatMessage[] = [
    { user: "ren", text: "POG" },
    { user: "ava", text: "clip that" },
    { user: "you", text },
  ];

  const handleSend = (value: string) => {
    setText(value);
    setSent(true);
    document
      .getElementById("step-1")
      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <>
      {/* HERO — become an event */}
      <header className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-24 pb-16 lg:min-h-[92vh] lg:grid-cols-[6fr_5fr] lg:gap-14 lg:pt-28 lg:pb-10 xl:max-w-[88rem]">
        <div>
          <p className="font-medium font-mono text-[11px] text-olive uppercase tracking-[0.14em]">
            Pulse · learning in public
          </p>
          <h1 className="mt-4 text-balance font-bold text-4xl text-white leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl xl:text-7xl">
            Learning <span className="ds-mark">Kafka</span> by building the real
            thing — in <RotatingWord />
          </h1>
          <p className="mt-5 max-w-md text-balance text-white/65 leading-relaxed lg:mt-7 lg:max-w-lg lg:text-lg">
            Pulse runs. Prove it to yourself: send a chat message, then scroll —
            the page follows{" "}
            <em className="text-electric-yellow not-italic">your</em> payload
            through Go, the log, and Kotlin, all the way back to your screen.
          </p>
          <p
            className={cn(
              "mt-7 font-mono text-[12.5px] tracking-[0.14em] transition-colors duration-300",
              sent ? "text-electric-yellow" : "text-white/80"
            )}
          >
            {sent
              ? "sent — now follow it ↓"
              : "① type something ② hit send ③ scroll"}
          </p>
        </div>
        <div className="w-full max-w-sm justify-self-center lg:max-w-md xl:max-w-lg">
          {/* the send moment gets one physical beat — the card breathes once */}
          <motion.div
            animate={sent && !reduce ? { scale: [1, 1.015, 1] } : undefined}
            transition={{ duration: 0.5, ease: EASE_OUT_STRONG }}
          >
            <MiniChannelApp
              className="shadow-[0_30px_80px_-25px_rgba(0,0,0,0.8),0_0_40px_-20px_var(--color-electric-yellow)]"
              interactive
              onSend={handleSend}
            />
          </motion.div>
          <p className="mt-3 font-mono text-[10px] text-white/40 leading-relaxed">
            A faithful miniature of pulse.tv's channel page. Your message stays
            on this page — the journey below is a stylised replay of the shipped
            pipeline.
          </p>
        </div>
      </header>

      <Ticker />

      {/* THE RIDE — scrolling steps + sticky payload inspector */}
      <div className="mx-auto grid max-w-6xl gap-[6vw] px-6 pt-[4vh] lg:grid-cols-[6fr_5fr]">
        <div className="min-w-0">
          {stages.map((s, i) => {
            const a = ACCENTS[s.accent];
            return (
              <motion.section
                className="relative flex flex-col justify-center border-white/10 border-l py-14 pl-8 lg:min-h-[85vh] lg:py-0"
                data-idx={i}
                id={s.id}
                initial={reduce ? false : "hidden"}
                key={s.id}
                variants={STEP_GROUP}
                viewport={{ amount: 0.25, once: true }}
                whileInView="show"
              >
                {/* the "you are here" dot — swells while its step owns the centre */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1/2 -left-[5px] size-2.5 rounded-full transition-transform duration-400",
                    a.dot,
                    i === active && "scale-150"
                  )}
                />
                <motion.p
                  className={cn(
                    "font-mono text-[10.5px] uppercase tracking-[0.16em]",
                    a.eyebrow
                  )}
                  variants={RISE}
                >
                  {s.step} · {s.place}
                </motion.p>
                <motion.h2
                  className="mt-3 font-bold text-3xl text-white leading-[1.06] tracking-[-0.025em] sm:text-4xl"
                  variants={RISE}
                >
                  {s.title}
                </motion.h2>
                <motion.p
                  className="mt-4 max-w-md text-[15px] text-white/60 leading-relaxed"
                  variants={RISE}
                >
                  {s.body}
                </motion.p>
                <motion.div
                  className="mt-5 flex flex-wrap gap-2"
                  variants={RISE}
                >
                  {s.meta.map((m) => (
                    <span
                      className={cn(
                        "rounded-pill border px-2.5 py-1 font-mono text-[10px] text-white/55 tracking-[0.04em]",
                        a.chip
                      )}
                      key={m}
                    >
                      {m}
                    </span>
                  ))}
                </motion.div>
                {/* the inspector is desktop-only; on mobile each step carries its payload */}
                {s.code && (
                  <motion.pre
                    className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-4 font-mono text-[11.5px] text-white/85 leading-[1.7] lg:hidden"
                    variants={RISE}
                  >
                    {s.code}
                  </motion.pre>
                )}
                {i === stages.length - 1 && (
                  <motion.div className="mt-8 max-w-sm" variants={RISE}>
                    <MiniChannelApp
                      flash={active === stages.length - 1}
                      messages={finalMessages}
                      viewers={active === stages.length - 1 ? 1287 : 1284}
                    />
                  </motion.div>
                )}
              </motion.section>
            );
          })}
        </div>

        {/* the inspector — hidden on mobile; steps carry their own meta */}
        <aside aria-live="polite" className="relative hidden lg:block">
          {/**
           * The frame and progress bar stay mounted; only the content block is
           * keyed by step, so fast scrolling re-animates the payload without
           * flickering the card's border, shadow, or progress state.
           */}
          <div className="sticky top-[calc(50vh-160px)] overflow-hidden rounded-2xl border border-white/15 bg-white/[0.035] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)]">
            <motion.div
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              initial={
                reduce
                  ? false
                  : { opacity: 0.4, y: 10, scale: 0.985, filter: "blur(2px)" }
              }
              key={active}
              transition={{ duration: 0.35, ease: EASE_OUT_STRONG }}
            >
              <div className="flex items-center gap-3 border-white/10 border-b px-4 py-3">
                <span
                  className={cn(
                    "rounded-pill px-2.5 py-0.5 font-bold font-mono text-[10px] uppercase tracking-[0.14em]",
                    accent.pill
                  )}
                >
                  {stage.step}
                </span>
                <span className="font-mono text-[11.5px] text-white/60">
                  {stage.place}
                </span>
              </div>
              {stage.code ? (
                <pre className="min-h-48 overflow-x-auto px-4 py-5 font-mono text-[12.5px] text-white/85 leading-[1.7]">
                  {stage.code}
                </pre>
              ) : (
                <div className="flex min-h-48 items-center justify-center gap-2.5 font-mono text-accent-green text-sm">
                  <span className="grid size-7 place-items-center rounded-full border-[1.5px] border-accent-green">
                    <IconCheck className="size-3.5" />
                  </span>
                  round trip complete
                </div>
              )}
            </motion.div>
            <div
              aria-hidden
              className="flex gap-1.5 border-white/10 border-t px-4 py-3"
            >
              {stages.map((s, i) => (
                <span
                  className={cn(
                    "h-[3px] flex-1 rounded-full transition-colors duration-400",
                    i <= active ? ACCENTS[s.accent].bar : "bg-white/10"
                  )}
                  key={s.id}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};
