"use client";

import { Heart, MessageSquare, UserPlus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The motivating example: a creator goes live, viewers flood the Channel, and
 * chat becomes a firehose. Particles stream from the live Channel into the Kafka
 * log and fan out to the (still-planned) consumers.
 *
 * Honesty, per the build-state convention in `AGENTS.md`: this is *illustrative*
 * — it depicts the load Pulse is being built to absorb, not a running system.
 * Phase 0 laid the pipe; nothing flows through it yet. The consumer nodes are
 * dashed for the same reason `<SystemTopology>` dashes its planned services.
 */
type Kind = "chat" | "react" | "viewer";

interface Particle {
  id: number;
  kind: Kind;
  lane: number;
  text: string;
}

const CHAT_LINES = [
  "let's goooo",
  "POG",
  "first!",
  "GGWP",
  "no wayyy",
  "clip that",
  "W stream",
  "🔥🔥",
];

const KIND_STYLE: Record<
  Kind,
  { icon: typeof Heart; ring: string; text: string }
> = {
  chat: {
    icon: MessageSquare,
    ring: "border-white/15 bg-white/[0.06] text-white/85",
    text: "",
  },
  react: {
    icon: Heart,
    ring: "border-electric-yellow/40 bg-electric-yellow/10 text-electric-yellow",
    text: "",
  },
  viewer: {
    icon: UserPlus,
    ring: "border-accent-green/40 bg-accent-green/10 text-accent-green",
    text: "+1 viewer",
  },
};

const LANES = 5;
let nextId = 0;

const rollKind = (roll: number): Kind => {
  if (roll < 0.62) {
    return "chat";
  }
  if (roll < 0.85) {
    return "react";
  }
  return "viewer";
};

const makeParticle = (): Particle => {
  const kind = rollKind(Math.random());
  return {
    id: nextId++,
    kind,
    lane: Math.floor(Math.random() * LANES),
    text:
      kind === "chat"
        ? CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)]
        : KIND_STYLE[kind].text,
  };
};

const CONSUMERS = [
  { label: "chat projection", sub: "Redis · planned" },
  { label: "analytics", sub: "Kotlin · planned" },
  { label: "notifications", sub: "planned" },
];

const Chip = ({ kind, text }: { kind: Kind; text: string }) => {
  const s = KIND_STYLE[kind];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-mono text-[11px] backdrop-blur-sm",
        s.ring
      )}
    >
      <Icon className="size-3" />
      {text}
    </span>
  );
};

/** Smoothly eases a display number toward a moving target. */
const useRamp = (target: number, active: boolean) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }
    const id = setInterval(() => {
      setValue((v) =>
        v < target ? Math.min(target, v + Math.ceil((target - v) / 18) + 7) : v
      );
    }, 60);
    return () => clearInterval(id);
  }, [target, active]);
  return value;
};

export const Firehose = () => {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [inView, setInView] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [count, setCount] = useState(0);

  const animate = !reduced && inView && width > 0;
  const viewers = useRamp(52_400, animate);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    );
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    ro.observe(el);
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!animate) {
      return;
    }
    const id = setInterval(() => {
      setParticles((prev) => [...prev.slice(-13), makeParticle()]);
      setCount((c) => c + 1);
    }, 430);
    return () => clearInterval(id);
  }, [animate]);

  const startX = width * 0.04;
  const endX = width * 0.52;
  const laneTop = (lane: number) => 16 + lane * 30;

  return (
    <div className="ds-stage relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
      {/* header strip */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            {animate && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-electric-yellow/70" />
            )}
            <span className="relative inline-flex size-2.5 rounded-full bg-electric-yellow" />
          </span>
          <span className="font-mono text-[11px] text-white/70 uppercase tracking-[0.14em]">
            channel · live
          </span>
        </div>
        <div className="flex items-center gap-5 font-mono text-[11px] text-white/55">
          <span>
            <span className="text-white tabular-nums">
              {viewers.toLocaleString()}
            </span>{" "}
            viewers
          </span>
          <span>
            <span className="text-electric-yellow tabular-nums">
              {(count * 3 + 128).toLocaleString()}
            </span>{" "}
            msgs
          </span>
        </div>
      </div>

      {/* the flow track */}
      <div className="relative h-[172px] w-full" ref={trackRef}>
        {/* source: the live channel */}
        <div className="absolute top-1/2 left-0 z-10 flex -translate-y-1/2 flex-col items-center gap-1.5">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-electric-yellow/40 bg-electric-yellow/[0.08] shadow-glow-sm">
            <span className="text-2xl">📡</span>
          </div>
          <span className="font-mono text-[10px] text-white/60">Stream</span>
        </div>

        {/* the kafka log */}
        <div className="absolute top-1/2 left-1/2 z-10 flex h-[140px] w-px -translate-y-1/2 flex-col items-center justify-center">
          <div className="absolute h-full w-[3px] rounded-full bg-gradient-to-b from-transparent via-electric-yellow to-transparent opacity-80" />
          <div className="absolute left-1/2 -translate-x-1/2 -rotate-90 whitespace-nowrap font-mono text-[10px] text-electric-yellow/80 tracking-widest">
            KAFKA LOG
          </div>
        </div>

        {/* streaming particles */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              animate={{ x: endX, opacity: [0, 1, 1, 0] }}
              className="absolute left-0 z-20"
              exit={{ opacity: 0 }}
              initial={{ x: startX, opacity: 0 }}
              key={p.id}
              onAnimationComplete={() =>
                setParticles((prev) => prev.filter((q) => q.id !== p.id))
              }
              style={{ top: laneTop(p.lane) }}
              transition={{
                duration: 2.4,
                ease: "linear",
                times: [0, 0.12, 0.8, 1],
              }}
            >
              <Chip kind={p.kind} text={p.text} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* reduced-motion: a few resting chips so the idea still reads */}
        {reduced && (
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <Chip kind="chat" text="POG" />
            <Chip kind="react" text="" />
            <Chip kind="viewer" text="+1 viewer" />
          </div>
        )}
      </div>

      {/* fan-out to the (planned) consumers */}
      <div className="mt-5 border-white/10 border-t pt-5">
        <p className="mb-3 font-mono text-[10px] text-white/45 uppercase tracking-[0.14em]">
          fans out to ↓
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {CONSUMERS.map((c) => (
            <div
              className="rounded-xl border border-white/15 border-dashed bg-white/[0.02] px-3 py-2.5 text-center"
              key={c.label}
            >
              <div className="font-medium text-[12px] text-white/80">
                {c.label}
              </div>
              <div className="font-mono text-[10px] text-white/40">{c.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 font-mono text-[10px] text-white/35 leading-relaxed">
        Illustrative — the load Pulse is built to absorb. Phase 0 laid the pipe;
        the consumers (dashed) arrive as their services ship.
      </p>
    </div>
  );
};
