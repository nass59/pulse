import {
  IconArrowRight,
  IconArrowUpRight,
  IconCheck,
  IconCompass,
  IconSparkles,
} from "@tabler/icons-react";
import Link from "next/link";

import { Eyebrow } from "@/components/docs/eyebrow";
import { FullBleed } from "@/components/docs/full-bleed";
import type { Concept } from "@/lib/concepts";
import { type PathStep, PILLARS, type PillarAccent } from "@/lib/pillars";
import { cn } from "@/lib/utils";

/**
 * The shared pillar landing (ADR-0021) — one component for all three pillars
 * (Kafka, Go, Kotlin), generalising the old per-tier `LearnPath` / `GoPath`
 * indexes plus the `ConceptIndex` catalogue into a single map. A pillar's
 * overview shows both halves of its shape: the ordered `path/` track and the
 * `concepts/` reference shelf. Static server component; the per-technology accent
 * (yellow / blue / purple) is the only thing that varies, driven by `ACCENT`.
 */
const ACCENT: Record<
  PillarAccent,
  {
    mark: string;
    tile: string;
    cardHover: string;
    check: string;
    note: string;
    noteIcon: string;
  }
> = {
  kafka: {
    mark: "ds-mark",
    tile: "border-electric-yellow/30 bg-electric-yellow/10 text-yellow-ink group-hover/card:border-electric-yellow/60 dark:text-electric-yellow",
    cardHover: "hover:border-electric-yellow/50 dark:hover:shadow-glow-sm",
    check: "text-accent-green",
    note: "border-electric-yellow/30 bg-electric-yellow/[0.06]",
    noteIcon: "text-yellow-ink dark:text-electric-yellow",
  },
  go: {
    mark: "ds-mark-go",
    tile: "border-go-blue/30 bg-go-blue/10 text-go-ink group-hover/card:border-go-blue/60 dark:text-go-blue",
    cardHover: "hover:border-go-blue/50 dark:hover:shadow-glow-go-sm",
    check: "text-go-blue",
    note: "border-go-blue/30 bg-go-blue/[0.05]",
    noteIcon: "text-go-blue",
  },
  kotlin: {
    mark: "ds-mark-kotlin",
    tile: "border-kotlin-purple/30 bg-kotlin-purple/10 text-kotlin-ink group-hover/card:border-kotlin-purple/60 dark:text-kotlin-purple",
    cardHover: "hover:border-kotlin-purple/50 dark:hover:shadow-glow-kotlin-sm",
    check: "text-kotlin-purple",
    note: "border-kotlin-purple/30 bg-kotlin-purple/[0.05]",
    noteIcon: "text-kotlin-purple",
  },
  systems: {
    mark: "ds-mark-systems",
    tile: "border-systems-red/30 bg-systems-red/10 text-systems-ink group-hover/card:border-systems-red/60 dark:text-systems-red",
    cardHover: "hover:border-systems-red/50 dark:hover:shadow-glow-systems-sm",
    check: "text-systems-red",
    note: "border-systems-red/30 bg-systems-red/[0.05]",
    noteIcon: "text-systems-red",
  },
};

const StepCard = ({
  step,
  n,
  accent,
}: {
  step: PathStep;
  n: number;
  accent: PillarAccent;
}) => {
  const Icon = step.icon;
  const a = ACCENT[accent];
  return (
    <Link
      className={cn(
        "group/card relative flex gap-5 rounded-2xl border border-border bg-card p-5 no-underline transition-all hover:-translate-y-0.5 hover:shadow-md sm:gap-7 sm:p-6",
        a.cardHover
      )}
      href={step.href}
    >
      <div className="flex shrink-0 flex-col items-center gap-3">
        <span className="font-bold text-4xl text-muted-foreground/25 tabular-nums leading-none sm:text-5xl">
          0{n}
        </span>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl border transition-colors",
            a.tile
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-foreground text-xl tracking-[-0.01em]">
            {step.title}
          </h3>
          <IconArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover/card:translate-x-0.5 group-hover/card:text-foreground" />
        </div>
        <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
          {step.blurb}
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {step.takeaways.map((t) => (
            <li
              className="flex items-start gap-2 text-foreground/80 text-xs"
              key={t}
            >
              <IconCheck className={cn("mt-0.5 size-3 shrink-0", a.check)} />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
};

const LiveConceptCard = ({
  concept,
  accent,
}: {
  concept: Concept;
  accent: PillarAccent;
}) => {
  const Icon = concept.icon;
  const a = ACCENT[accent];
  return (
    <Link
      className={cn(
        "group/card flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6",
        a.cardHover
      )}
      href={concept.href ?? "#"}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
            a.tile
          )}
        >
          <Icon className="size-5" />
        </span>
        <IconArrowUpRight className="size-4 text-muted-foreground transition-all group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:text-foreground" />
      </div>
      <h3 className="mt-4 flex flex-wrap items-center gap-2 font-semibold text-foreground text-lg tracking-[-0.01em]">
        {concept.title}
        {concept.interactive && (
          <span className="inline-flex items-center gap-1 rounded-pill border border-accent-purple/40 px-2 py-0.5 font-medium font-mono text-[10px] text-accent-purple uppercase tracking-[0.08em]">
            <IconSparkles className="size-2.5" />
            interactive
          </span>
        )}
      </h3>
      <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
        {concept.blurb}
      </p>
    </Link>
  );
};

const ComingConceptCard = ({ concept }: { concept: Concept }) => {
  const Icon = concept.icon;
  return (
    <div className="flex flex-col rounded-2xl border border-border border-dashed bg-transparent p-5 opacity-80">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border border-dashed text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <span className="font-medium font-mono text-[10px] text-muted-foreground uppercase tracking-[0.1em]">
          coming
        </span>
      </div>
      <h3 className="mt-4 font-semibold text-base text-muted-foreground tracking-[-0.01em]">
        {concept.title}
      </h3>
      <p className="mt-1.5 text-muted-foreground/80 text-sm leading-relaxed">
        {concept.blurb}
      </p>
    </div>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-12 flex items-center gap-3">
    <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.12em]">
      {children}
    </p>
    <span className="h-px flex-1 bg-border" />
  </div>
);

export const PillarOverview = ({ pillar }: { pillar: PillarAccent }) => {
  const spec = PILLARS[pillar];
  const a = ACCENT[pillar];
  return (
    <FullBleed>
      <section className="mx-auto max-w-4xl px-6 py-4">
        <Eyebrow>{spec.eyebrow}</Eyebrow>
        <h1 className="mt-4 text-balance font-bold text-4xl text-foreground tracking-[-0.025em] sm:text-5xl">
          {spec.title.lead} <span className={a.mark}>{spec.title.mark}</span>
          {spec.title.tail ? ` ${spec.title.tail}` : null}
        </h1>
        <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
          {spec.intro}
        </p>

        <div
          className={cn(
            "mt-5 inline-flex items-start gap-2.5 rounded-2xl border px-4 py-3",
            a.note
          )}
        >
          <IconCompass className={cn("mt-0.5 size-4 shrink-0", a.noteIcon)} />
          <p className="text-foreground/80 text-sm leading-relaxed">
            {spec.note}
          </p>
        </div>

        {spec.steps.length > 0 && (
          <>
            <SectionLabel>The path · read in order</SectionLabel>
            <div className="mt-5 flex flex-col gap-4">
              {spec.steps.map((step, i) => (
                <StepCard
                  accent={pillar}
                  key={step.href}
                  n={i + 1}
                  step={step}
                />
              ))}
            </div>
          </>
        )}

        {spec.concepts.length > 0 && (
          <>
            <SectionLabel>Concepts · hit on demand</SectionLabel>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {spec.concepts.map((concept) => (
                <LiveConceptCard
                  accent={pillar}
                  concept={concept}
                  key={concept.title}
                />
              ))}
            </div>
          </>
        )}

        {spec.comingConcepts.length > 0 && (
          <>
            <SectionLabel>On the roadmap</SectionLabel>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {spec.comingConcepts.map((concept) => (
                <ComingConceptCard concept={concept} key={concept.title} />
              ))}
            </div>
          </>
        )}
      </section>
    </FullBleed>
  );
};
