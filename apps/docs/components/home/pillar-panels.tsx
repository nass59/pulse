"use client";

import { RotateCcw } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * "Three technologies, one job each." — the per-pillar widget row from the
 * design contract, all three depicting SHIPPED capabilities (Kotlin's
 * hopping window went live with `analytics-mvp`, ADR-0022). Each panel
 * carries a subtle radial wash of its technology's accent — semantic, not
 * decorative: the colour marks which technology the panel is about
 * (ADR-0020). Kafka spans the full row; Go and Kotlin split the second.
 */

/** Eases a display number toward a target while the panel is in view. */
const useRamp = (target: number, active: boolean) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }
    const id = setInterval(() => {
      setValue((v) =>
        v < target ? Math.min(target, v + Math.ceil((target - v) / 16) + 5) : v
      );
    }, 55);
    return () => clearInterval(id);
  }, [target, active]);
  return value;
};

const Panel = ({
  children,
  className,
  eyebrow,
  eyebrowClass,
  title,
  wash,
}: {
  children: React.ReactNode;
  className?: string;
  eyebrow: string;
  eyebrowClass: string;
  title: string;
  /** The accent for the radial wash, as a CSS color token. */
  wash: string;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-white/10 bg-white/[0.03] p-6",
      className
    )}
    style={{
      backgroundImage: `radial-gradient(110% 90% at 50% 0%, color-mix(in oklab, ${wash} 8%, transparent), transparent 65%)`,
      borderColor: `color-mix(in oklab, ${wash} 22%, rgb(255 255 255 / 0.09))`,
    }}
  >
    <p
      className={cn(
        "font-medium font-mono text-[10.5px] uppercase tracking-[0.14em]",
        eyebrowClass
      )}
    >
      {eyebrow}
    </p>
    <h3 className="mt-2 font-bold text-lg text-white tracking-[-0.01em]">
      {title}
    </h3>
    {children}
  </div>
);

const REPLAY_TOTAL = 30;

/**
 * Precomputed at module scope so each bar has a stable identity (its offset)
 * to key by — same trick as log-tape's `makeRecord`. Heights are a
 * deterministic pseudo-random pattern, safe for SSR.
 */
const REPLAY_BARS = Array.from({ length: REPLAY_TOTAL }, (_, i) => ({
  offset: i,
  height: 30 + ((i * 37) % 60),
}));

/** Kafka — scrub the consumer offset and re-read the log. */
const KafkaReplay = () => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [head, setHead] = useState(reduce ? REPLAY_TOTAL - 1 : 0);
  const [playing, setPlaying] = useState(false);
  const autoplayed = useRef(false);

  useEffect(() => {
    if (!(playing && inView) || reduce) {
      return;
    }
    const id = setInterval(() => {
      setHead((h) => {
        if (h >= REPLAY_TOTAL - 1) {
          setPlaying(false);
          return h;
        }
        return h + 1;
      });
    }, 110);
    return () => clearInterval(id);
  }, [playing, inView, reduce]);

  /** Autoplay is a one-shot on first entry into view. */
  useEffect(() => {
    if (inView && !reduce && !autoplayed.current) {
      autoplayed.current = true;
      setPlaying(true);
    }
  }, [inView, reduce]);

  return (
    <div ref={ref}>
      <p className="mt-2 max-w-2xl text-sm text-white/60 leading-relaxed">
        The log is durable and ordered. A new consumer rewinds to offset 0 and
        re-reads every record — nothing is consumed-and-gone.
      </p>
      <div className="mt-5 flex h-16 items-end gap-[3px]">
        {REPLAY_BARS.map((bar) => (
          <span
            className={cn(
              "flex-1 rounded-t-[2px] transition-colors duration-150",
              bar.offset <= head ? "bg-electric-yellow" : "bg-white/15",
              bar.offset === head && "shadow-glow-sm"
            )}
            key={bar.offset}
            style={{ height: `${bar.height}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-white/40">
        <span>offset 0</span>
        <span className="text-electric-yellow">consumer at offset {head}</span>
        <span>offset {REPLAY_TOTAL - 1}</span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button
          className="inline-flex items-center gap-2 rounded-pill border border-white/15 px-3.5 py-1.5 font-mono text-white/80 text-xs transition-all hover:border-electric-yellow/60 active:scale-[0.97]"
          onClick={() => {
            setHead(0);
            setPlaying(true);
          }}
          type="button"
        >
          <RotateCcw className="size-3" />
          Replay from 0
        </button>
        <input
          aria-label="consumer offset"
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-electric-yellow"
          max={REPLAY_TOTAL - 1}
          min={0}
          onChange={(event) => {
            setPlaying(false);
            setHead(Number(event.target.value));
          }}
          type="range"
          value={head}
        />
      </div>
    </div>
  );
};

const FAN_LINES = 40;

/** Endpoint y-coordinates of the fan — each doubles as its line's key. */
const FAN_LINE_YS = Array.from(
  { length: FAN_LINES },
  (_, i) => 10 + i * (180 / (FAN_LINES - 1))
);

/** Go — one gateway, thousands of sockets, a goroutine each. */
const GoFanout = () => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const active = inView && !reduce;
  const connections = useRamp(12_480, active);

  return (
    <div ref={ref}>
      <p className="mt-2 text-sm text-white/60 leading-relaxed">
        The chat gateway holds thousands of live WebSockets at once — each its
        own lightweight goroutine, blocking cheaply on its own socket.
      </p>
      <p className="mt-4 font-bold font-mono text-2xl text-go-blue tabular-nums">
        {connections.toLocaleString()}
      </p>
      <p className="font-mono text-[10px] text-white/40">
        live connections · 1 goroutine each
      </p>
      <svg
        aria-hidden="true"
        className="mt-3 h-36 w-full"
        preserveAspectRatio="none"
        viewBox="0 0 320 200"
      >
        <circle
          className="fill-go-blue drop-shadow-[0_0_6px_var(--color-go-blue)]"
          cx="36"
          cy="100"
          r="10"
        />
        <circle
          className="stroke-go-blue/35"
          cx="36"
          cy="100"
          fill="none"
          r="17"
        />
        {FAN_LINE_YS.map((y, i) => (
          <motion.line
            animate={active ? { pathLength: 1 } : { pathLength: 0 }}
            className="stroke-go-blue/50"
            initial={false}
            key={y}
            strokeWidth="1.1"
            transition={{ duration: 0.55, delay: i * 0.02, ease: "easeOut" }}
            x1="46"
            x2="300"
            y1="100"
            y2={y}
          />
        ))}
      </svg>
    </div>
  );
};

const HOP_WINDOWS = [
  { count: 1279, left: 4 },
  { count: 1281, left: 22 },
  { count: 1284, left: 40 },
  { count: 1286, left: 58 },
];

/** Sweep-line positions per tick, in percent. */
const SWEEP_LEFT = [12, 32, 52, 72, 92];

/** Presence-event tick marks along the timeline; `left` is each one's key. */
const PRESENCE_TICKS = Array.from({ length: 14 }, (_, i) => ({
  left: 6 + i * 6.6,
  opacity: 0.4 + ((i * 7) % 5) * 0.12,
}));

/** Kotlin — the hopping window that computes the hero's viewer count. */
const KotlinHopping = () => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const active = inView && !reduce;
  const [tick, setTick] = useState(reduce ? 3 : 0);

  useEffect(() => {
    if (!active) {
      return;
    }
    const id = setInterval(
      () => setTick((t) => (t + 1) % SWEEP_LEFT.length),
      1100
    );
    return () => clearInterval(id);
  }, [active]);

  return (
    <div ref={ref}>
      <p className="mt-2 text-sm text-white/60 leading-relaxed">
        The viewer count on the hero is computed here: a 60-second presence
        horizon, re-evaluated every 10 seconds. Windows overlap — every event
        lands in six of them — and each close emits a fresh{" "}
        <code className="text-kotlin-purple">analytics.viewer-count.v1</code>.
      </p>
      <div className="relative mt-5 h-36 border-white/15 border-b border-l">
        {HOP_WINDOWS.map((window, i) => (
          <div
            className={cn(
              "absolute h-5 w-[38%] rounded border border-kotlin-purple bg-kotlin-purple/10 transition-all duration-400",
              tick >= i
                ? "translate-y-0 opacity-100"
                : "translate-y-1 opacity-0",
              tick > i && "bg-kotlin-purple/25"
            )}
            key={window.count}
            style={{ left: `${window.left}%`, top: `${14 + i * 26}px` }}
          >
            <span
              className={cn(
                "absolute -top-4 right-0 font-mono text-[9.5px] text-kotlin-purple transition-opacity",
                tick > i ? "opacity-100" : "opacity-50"
              )}
            >
              {tick > i ? `▲ ${window.count.toLocaleString()}` : "60s"}
            </span>
          </div>
        ))}
        <div aria-hidden className="absolute inset-x-0 bottom-4 h-2">
          {PRESENCE_TICKS.map((mark) => (
            <span
              className="absolute bottom-0 h-2 w-1 rounded-[1px] bg-white/40"
              key={mark.left}
              style={{ left: `${mark.left}%`, opacity: mark.opacity }}
            />
          ))}
        </div>
        <span
          className="absolute top-0 bottom-3.5 w-px bg-electric-yellow shadow-glow-sm transition-[left] duration-1000 ease-linear"
          style={{ left: `${SWEEP_LEFT[tick]}%` }}
        />
        <div className="absolute inset-x-0 -bottom-6 flex justify-between font-mono text-[9.5px] text-white/40">
          <span>−60s</span>
          <span>hop · 10s</span>
          <span>now</span>
        </div>
      </div>
      <div className="h-6" />
    </div>
  );
};

export const PillarPanels = () => (
  <section className="mx-auto max-w-6xl px-6 py-16 lg:py-[11vh]" id="pillars">
    <p className="font-medium font-mono text-[11px] text-olive uppercase tracking-[0.14em]">
      {"// the machinery you just rode"}
    </p>
    <h2 className="mt-3 mb-9 font-bold text-3xl text-white tracking-[-0.02em] sm:text-4xl">
      Three technologies, one job each.
    </h2>
    <div className="grid gap-4 md:grid-cols-2">
      <Panel
        className="md:col-span-2"
        eyebrow="Kafka · the log remembers"
        eyebrowClass="text-electric-yellow"
        title="Replay from any offset"
        wash="var(--color-electric-yellow)"
      >
        <KafkaReplay />
      </Panel>
      <Panel
        eyebrow="Go · the gateway"
        eyebrowClass="text-go-blue"
        title="One goroutine per connection"
        wash="var(--color-go-blue)"
      >
        <GoFanout />
      </Panel>
      <Panel
        eyebrow="Kotlin · Kafka Streams · live"
        eyebrowClass="text-kotlin-purple"
        title="Hopping windows over presence"
        wash="var(--color-kotlin-purple)"
      >
        <KotlinHopping />
      </Panel>
    </div>
  </section>
);
