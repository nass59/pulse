"use client";

import { ArrowUpRight, Check, ChevronRight, Circle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { PHASES, type Phase, type PhaseItem } from "@/lib/roadmap";
import { cn } from "@/lib/utils";

/**
 * Version B — "Build Pipeline". The roadmap as a CI pipeline: a vertical run of
 * stages, each `passed` / `running` / `queued`, in DevLab's mono register. The
 * running stage (Phase 0) is open by default and shows its steps as a live
 * checklist — done vs in-flight — so the "you are here" is a real task ledger,
 * not a label. Restrained and developer-native by design.
 */

const STATUS_LABEL: Record<Phase["status"], string> = {
  shipped: "passed",
  current: "running",
  planned: "queued",
};

const StageGlyph = ({ status }: { status: Phase["status"] }) => {
  const reduce = useReducedMotion();
  if (status === "shipped") {
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-electric-yellow text-yellow-ink">
        <Check className="size-3.5" />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="relative flex size-6 items-center justify-center rounded-full border-2 border-electric-yellow">
        {!reduce && (
          <motion.span
            animate={{ rotate: 360 }}
            className="absolute inset-[-2px] rounded-full border-2 border-transparent border-t-electric-yellow"
            transition={{
              duration: 1.4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        )}
        <span className="size-2 rounded-full bg-electric-yellow" />
      </span>
    );
  }
  return (
    <span className="flex size-6 items-center justify-center rounded-full border border-border border-dashed text-muted-foreground">
      <Circle className="size-2 fill-current" />
    </span>
  );
};

const StatusPill = ({ status }: { status: Phase["status"] }) => (
  <span
    className={cn(
      "rounded-pill px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]",
      status === "planned"
        ? "bg-muted text-muted-foreground"
        : "bg-electric-yellow/15 text-yellow-ink dark:text-electric-yellow"
    )}
  >
    {STATUS_LABEL[status]}
  </span>
);

const StepGlyph = ({ item }: { item: PhaseItem }) => {
  if (item.done) {
    return <Check className="size-3.5 shrink-0 text-electric-yellow" />;
  }
  if (item.done === false) {
    return (
      <span className="size-3.5 shrink-0 animate-pulse rounded-full border border-electric-yellow/60" />
    );
  }
  return (
    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
  );
};

/** Done reads strongest, in-flight next, queued faintest. */
const stepTone = (item: PhaseItem) => {
  if (item.done) {
    return "text-foreground";
  }
  if (item.done === false) {
    return "text-foreground/80";
  }
  return "text-muted-foreground";
};

const Step = ({ item }: { item: PhaseItem }) => {
  const live = Boolean(item.href);
  const pending = item.done === false;

  const label = (
    <span className={cn("font-mono text-[13px]", stepTone(item))}>
      {item.label}
    </span>
  );

  return (
    <li className="flex items-center gap-2.5">
      <StepGlyph item={item} />
      {live && item.href ? (
        <Link
          className="group/step inline-flex items-center gap-1 hover:text-electric-yellow"
          href={item.href}
        >
          {label}
          <ArrowUpRight className="size-3 text-muted-foreground transition-transform group-hover/step:translate-x-0.5 group-hover/step:-translate-y-0.5" />
        </Link>
      ) : (
        label
      )}
      {pending && (
        <span className="font-mono text-[10px] text-electric-yellow/70 uppercase tracking-[0.1em]">
          in&nbsp;progress
        </span>
      )}
    </li>
  );
};

const Stage = ({
  phase,
  open,
  onToggle,
}: {
  phase: Phase;
  open: boolean;
  onToggle: () => void;
}) => {
  const reduce = useReducedMotion();
  const done = phase.items.filter((i) => i.done).length;
  const total = phase.items.length;
  const running = phase.status === "current";

  return (
    <li className="relative pl-10">
      {/* rail */}
      <span className="absolute top-7 bottom-0 left-[11px] w-px bg-border last:hidden" />
      <span className="absolute top-0 left-0">
        <StageGlyph status={phase.status} />
      </span>

      <button
        className="group flex w-full items-center gap-3 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="font-medium font-mono text-muted-foreground text-xs">
          phase-{phase.n}
        </span>
        <span className="font-semibold text-base tracking-[-0.01em]">
          {phase.name}
        </span>
        <StatusPill status={phase.status} />
        <span className="ml-auto flex items-center gap-3">
          {running && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {done}/{total}
            </span>
          )}
          <span className="font-mono text-[11px] text-muted-foreground">
            {phase.effort}
          </span>
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              open && "rotate-90"
            )}
          />
        </span>
      </button>

      <p className="mt-1.5 max-w-2xl text-muted-foreground text-sm leading-relaxed">
        {phase.lesson}
      </p>

      {running && (
        <div className="mt-3 h-1 w-full max-w-xs overflow-hidden rounded-pill bg-muted">
          <motion.div
            className="h-full rounded-pill bg-electric-yellow"
            initial={reduce ? false : { width: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true }}
            whileInView={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: "easeInOut" }}
          >
            <ul className="mt-4 mb-2 space-y-2">
              {phase.items.map((item) => (
                <Step item={item} key={item.label} />
              ))}
            </ul>
            <p className="mt-3 mb-4 border-electric-yellow/40 border-l-2 pl-3 text-muted-foreground text-xs italic leading-relaxed">
              Ships when: {phase.shipsWhen}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

export const RoadmapBuildPipeline = () => {
  const [open, setOpen] = useState<Set<number>>(
    () => new Set(PHASES.filter((p) => p.status === "current").map((p) => p.n))
  );

  const toggle = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else {
        next.add(n);
      }
      return next;
    });

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <p className="ds-eyebrow">Build pipeline</p>
      <h2 className="mt-3 font-bold text-3xl text-foreground tracking-[-0.02em] sm:text-4xl">
        Five stages, run in order.
      </h2>
      <p className="mt-4 max-w-2xl text-balance text-muted-foreground leading-relaxed">
        Each phase is a stage that has to go green before the next one starts.
        Phase 0 is running now — open it to see what&apos;s passed and
        what&apos;s still in flight.
      </p>

      <ol className="mt-12 space-y-8">
        {PHASES.map((phase) => (
          <Stage
            key={phase.n}
            onToggle={() => toggle(phase.n)}
            open={open.has(phase.n)}
            phase={phase}
          />
        ))}
      </ol>
    </section>
  );
};
