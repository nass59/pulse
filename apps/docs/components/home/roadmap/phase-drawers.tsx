"use client";

import { ArrowUpRight, Check, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { PHASES, type Phase, type PhaseItem } from "@/lib/roadmap";
import { cn } from "@/lib/utils";

/**
 * Version C — "Phase Drawers". The roadmap as a paper-editorial accordion:
 * oversized ghost numerals, hairline rules, one phase open at a time. The
 * current phase wears the `ds-mark` highlighter swipe and opens by default;
 * each drawer reveals the phase's concept grid and its "ships when" definition.
 * Calm, magazine-like — the quiet counterpart to the dark Signal Path.
 */

const STATUS_LABEL: Record<Phase["status"], string> = {
  shipped: "Shipped",
  current: "In progress",
  planned: "Planned",
};

const ConceptChip = ({ item }: { item: PhaseItem }) => {
  const live = Boolean(item.href);
  const base =
    "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-sm transition-colors";

  if (live && item.href) {
    return (
      <Link
        className={cn(
          base,
          "group/chip border-electric-yellow/40 bg-yellow-tint text-yellow-ink hover:border-electric-yellow dark:bg-electric-yellow/10 dark:text-electric-yellow"
        )}
        href={item.href}
      >
        <Check className="size-3.5" />
        {item.label}
        <ArrowUpRight className="size-3.5 opacity-50 transition-transform group-hover/chip:translate-x-0.5 group-hover/chip:-translate-y-0.5 group-hover/chip:opacity-100" />
      </Link>
    );
  }

  const pending = item.done === false;
  return (
    <span
      className={cn(
        base,
        "border-dashed text-muted-foreground",
        pending ? "border-electric-yellow/40" : "border-border"
      )}
    >
      {pending && (
        <span className="size-1.5 animate-pulse rounded-full bg-electric-yellow" />
      )}
      {item.label}
    </span>
  );
};

const Numeral = ({ phase }: { phase: Phase }) => {
  const text = `0${phase.n}`;
  if (phase.status === "current") {
    return (
      <span className="ds-mark font-bold text-5xl tabular-nums leading-none sm:text-6xl">
        {text}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "font-bold text-5xl tabular-nums leading-none sm:text-6xl",
        phase.status === "shipped"
          ? "text-foreground/80"
          : "text-muted-foreground/25"
      )}
    >
      {text}
    </span>
  );
};

const Drawer = ({
  phase,
  open,
  onToggle,
}: {
  phase: Phase;
  open: boolean;
  onToggle: () => void;
}) => {
  const reduce = useReducedMotion();
  const planned = phase.status === "planned";

  return (
    <div className="border-border border-t">
      <button
        className="group flex w-full items-center gap-5 py-7 text-left sm:gap-8"
        onClick={onToggle}
        type="button"
      >
        <span className="w-14 shrink-0 sm:w-20">
          <Numeral phase={phase} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2.5">
            <span
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.14em]",
                planned
                  ? "text-muted-foreground"
                  : "text-yellow-ink dark:text-electric-yellow"
              )}
            >
              {STATUS_LABEL[phase.status]}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground tracking-[0.08em]">
              · {phase.effort}
            </span>
          </span>
          <span
            className={cn(
              "mt-1.5 block font-semibold text-xl tracking-[-0.01em] sm:text-2xl",
              planned ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {phase.name}
          </span>
          <span className="mt-1 block max-w-xl text-muted-foreground text-sm leading-relaxed">
            {phase.lesson}
          </span>
        </span>

        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border border-border transition-all group-hover:border-electric-yellow/60",
            open && "rotate-45 bg-electric-yellow text-yellow-ink"
          )}
        >
          <Plus className="size-4" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: "easeInOut" }}
          >
            <div className="pb-9 sm:pl-28">
              <div className="flex flex-wrap gap-2">
                {phase.items.map((item) => (
                  <ConceptChip item={item} key={item.label} />
                ))}
              </div>
              <p className="mt-5 max-w-2xl text-pretty text-muted-foreground text-sm leading-relaxed">
                <span className="font-medium text-foreground">Ships when </span>
                {phase.shipsWhen}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const RoadmapPhaseDrawers = () => {
  const [openN, setOpenN] = useState<number | null>(
    () => PHASES.find((p) => p.status === "current")?.n ?? null
  );

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <div className="max-w-2xl">
        <p className="ds-eyebrow">The arc</p>
        <h2 className="mt-3 font-bold text-3xl text-foreground tracking-[-0.02em] sm:text-4xl">
          From empty repo to a system that needs Kafka.
        </h2>
        <p className="mt-4 text-balance text-muted-foreground leading-relaxed">
          Five phases, each with one architectural lesson and a concrete finish
          line. Open any phase to see the concepts it earns — the lit ones have
          pages, the rest land as the work that proves them ships.
        </p>
      </div>

      <div className="mt-12 border-border border-b">
        {PHASES.map((phase) => (
          <Drawer
            key={phase.n}
            onToggle={() =>
              setOpenN((cur) => (cur === phase.n ? null : phase.n))
            }
            open={openN === phase.n}
            phase={phase}
          />
        ))}
      </div>
    </section>
  );
};
