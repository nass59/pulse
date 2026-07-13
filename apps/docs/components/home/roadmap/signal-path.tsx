"use client";

import { IconCheck } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

import { FullBleed } from "@/components/docs/full-bleed";
import { PHASES, type Phase, type PhaseItem } from "@/lib/roadmap";
import { cn } from "@/lib/utils";

/**
 * Version A — "Signal Path". The build read as a circuit on the dark lab
 * surface: a horizontal track whose line is energised (solid yellow + glow) up
 * to where Pulse actually is, then dashed and dim for the road ahead — the same
 * honesty `<SystemTopology>` applies to its edges. The current phase is the one
 * pulsing node; stations zig-zag above and below the line, each carrying its
 * lesson, effort, and concept chips.
 */

/** Index of the current ("you are here") phase, for the energised-line length. */
const currentIndex = Math.max(
  0,
  PHASES.findIndex((p) => p.status === "current")
);

const Chip = ({ item }: { item: PhaseItem }) => {
  const live = Boolean(item.href);
  const base =
    "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 font-mono text-[10px] tracking-tight transition-colors";

  if (live && item.href) {
    return (
      <Link
        className={cn(
          base,
          "border border-electric-yellow/40 bg-electric-yellow/10 text-electric-yellow hover:bg-electric-yellow/20"
        )}
        href={item.href}
      >
        <IconCheck className="size-3" />
        {item.label}
      </Link>
    );
  }

  /** A pending item inside the current phase reads as "in flight", not absent. */
  const pending = item.done === false;
  return (
    <span
      className={cn(
        base,
        "border border-dashed",
        pending
          ? "border-electric-yellow/30 text-electric-yellow/70"
          : "border-white/15 text-white/40"
      )}
    >
      {pending && (
        <span className="size-1.5 animate-pulse rounded-full bg-electric-yellow/70" />
      )}
      {item.label}
    </span>
  );
};

const Node = ({ status }: { status: Phase["status"] }) => {
  const reduce = useReducedMotion();
  if (status === "current") {
    return (
      <span className="relative flex size-5 items-center justify-center">
        {!reduce && (
          <motion.span
            animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
            className="absolute inset-0 rounded-full bg-electric-yellow"
            transition={{
              duration: 1.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeOut",
            }}
          />
        )}
        <span className="size-3.5 rounded-full bg-electric-yellow shadow-glow-md" />
      </span>
    );
  }
  if (status === "shipped") {
    return (
      <span className="size-4 rounded-full bg-electric-yellow shadow-glow-sm" />
    );
  }
  return (
    <span className="size-4 rounded-full border border-white/30 border-dashed bg-carbon-900" />
  );
};

const StationCard = ({ phase }: { phase: Phase }) => {
  const planned = phase.status === "planned";
  return (
    <div
      className={cn(
        "w-60 rounded-2xl border p-4 text-left backdrop-blur-sm transition-colors",
        planned
          ? "border-white/15 bg-white/[0.045]"
          : "border-electric-yellow/30 bg-white/[0.06]"
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "font-mono text-[11px] uppercase tracking-[0.14em]",
            planned ? "text-white/40" : "text-electric-yellow"
          )}
        >
          Phase {phase.n}
        </span>
        <span className="font-mono text-[10px] text-white/35">
          {phase.effort}
        </span>
      </div>
      <h3 className="mt-1.5 font-semibold text-base text-white tracking-[-0.01em]">
        {phase.name}
      </h3>
      <p className="mt-1.5 text-[13px] text-white/55 leading-snug">
        {phase.lesson}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {phase.items.map((item) => (
          <Chip item={item} key={item.label} />
        ))}
      </div>
    </div>
  );
};

const Station = ({ phase, index }: { phase: Phase; index: number }) => {
  const reduce = useReducedMotion();
  /** Alternate above / below the line for the classic timeline zig-zag. */
  const above = index % 2 === 0;
  const current = phase.status === "current";

  return (
    <motion.li
      className="relative flex h-full w-60 shrink-0 snap-center items-center justify-center"
      initial={reduce ? false : { opacity: 0, y: above ? -16 : 16 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.12 }}
      viewport={{ once: true, margin: "-80px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div
        className={cn(
          "absolute left-1/2 flex -translate-x-1/2 flex-col items-center",
          above ? "bottom-1/2 mb-7" : "top-1/2 mt-7"
        )}
      >
        {!above && (
          <span className="h-7 w-px bg-gradient-to-b from-white/25 to-transparent" />
        )}
        <StationCard phase={phase} />
        {above && (
          <span className="h-7 w-px bg-gradient-to-t from-white/25 to-transparent" />
        )}
      </div>

      <Node status={phase.status} />

      {current && (
        <span
          className={cn(
            "absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-electric-yellow uppercase tracking-[0.14em]",
            above ? "top-1/2 mt-3" : "bottom-1/2 mb-3"
          )}
        >
          ← you are here
        </span>
      )}
    </motion.li>
  );
};

export const RoadmapSignalPath = () => {
  const reduce = useReducedMotion();
  /** Centre of station i in a 5-up even row, as a fraction of the rail. */
  const energisedTo = ((currentIndex + 0.5) / PHASES.length) * 100;

  return (
    <FullBleed className="ds-stage text-white">
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <p className="font-medium font-mono text-[11px] text-electric-yellow uppercase tracking-[0.14em]">
          The build, end to end
        </p>
        <h2 className="mt-3 text-balance font-bold text-3xl leading-[1.1] tracking-[-0.02em] sm:text-4xl">
          One signal, five phases.
        </h2>
        <p className="mt-4 max-w-2xl text-balance text-white/60 leading-relaxed">
          The line is live where Pulse is built and dashed where it isn&apos;t —
          no faking the road ahead. Right now the signal reaches Phase 0; each
          phase lights up as the work that proves it lands.
        </p>

        <div className="-mx-6 mt-14 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative mx-auto h-[40rem] min-w-[60rem]">
            {/* base line — the whole road, dashed and dim */}
            <div className="absolute top-1/2 right-0 left-0 h-px border-white/15 border-t border-dashed" />
            {/* energised overlay — only as far as we've actually built */}
            <motion.div
              className="absolute top-1/2 left-0 h-[2px] origin-left bg-electric-yellow shadow-glow-sm"
              initial={reduce ? false : { scaleX: 0 }}
              style={{ width: `${energisedTo}%` }}
              transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
              viewport={{ once: true }}
              whileInView={{ scaleX: 1 }}
            />
            <ol className="relative flex h-full snap-x snap-mandatory items-center">
              {PHASES.map((phase, i) => (
                <Station index={i} key={phase.n} phase={phase} />
              ))}
            </ol>
          </div>
        </div>
      </section>
    </FullBleed>
  );
};
