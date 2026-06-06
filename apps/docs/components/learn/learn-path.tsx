import { ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";

import { Eyebrow } from "@/components/docs/eyebrow";
import { FullBleed } from "@/components/docs/full-bleed";
import { LEARN_STEPS, type LearnStep } from "@/lib/learn";

/**
 * The `Learn` track index (ADR-0011) — a linear "Kafka from zero" path. Static
 * server component: the path doesn't need a client boundary, matching the
 * diagram-first ethos. Each step is `live` from day one (the track teaches the
 * technology, so it isn't build-state-gated like `/concepts`). The numbered
 * ghost-numeral spine borrows the homepage roadmap's aesthetic so the two read
 * as one family.
 */
const StepCard = ({ step, n }: { step: LearnStep; n: number }) => {
  const Icon = step.icon;
  return (
    <Link
      className="group/step relative flex gap-5 rounded-2xl border border-border bg-card p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-electric-yellow/50 hover:shadow-md sm:gap-7 sm:p-6 dark:hover:shadow-glow-sm"
      href={step.href}
    >
      <div className="flex shrink-0 flex-col items-center gap-3">
        <span className="font-bold text-4xl text-muted-foreground/25 tabular-nums leading-none sm:text-5xl">
          0{n}
        </span>
        <span className="flex size-10 items-center justify-center rounded-xl border border-electric-yellow/30 bg-electric-yellow/10 text-yellow-ink dark:text-electric-yellow">
          <Icon className="size-5" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-foreground text-xl tracking-[-0.01em]">
            {step.title}
          </h3>
          <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover/step:translate-x-0.5 group-hover/step:text-foreground" />
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
              <Check className="mt-0.5 size-3 shrink-0 text-accent-green" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
};

export const LearnPath = () => (
  <FullBleed>
    <section className="mx-auto max-w-3xl px-6 py-4">
      <Eyebrow>Learn · Kafka from zero</Eyebrow>
      <h1 className="mt-4 text-balance font-bold text-4xl text-foreground tracking-[-0.025em] sm:text-5xl">
        Kafka, explained like a <span className="ds-mark">friend</span> would
      </h1>
      <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
        A short, linear path for a senior engineer who has built plenty — just
        never with Kafka. No prior knowledge assumed; one big idea per page, a
        diagram or a thing-you-can-poke instead of a wall of text.
      </p>

      <div className="mt-5 inline-flex items-start gap-2.5 rounded-2xl border border-accent-purple/30 bg-accent-purple/[0.05] px-4 py-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-accent-purple" />
        <p className="text-foreground/80 text-sm leading-relaxed">
          This track teaches{" "}
          <span className="font-medium text-foreground">
            Kafka the technology
          </span>{" "}
          — the diagrams show the universal mechanism, not Pulse's own system.
          For how <em>Pulse</em> wires Kafka up, head to the{" "}
          <Link
            className="font-medium text-foreground underline decoration-2 decoration-electric-yellow underline-offset-2"
            href="/concepts"
          >
            Concepts
          </Link>{" "}
          tier once the fundamentals click.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4">
        {LEARN_STEPS.map((step, i) => (
          <StepCard key={step.href} n={i + 1} step={step} />
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-3 rounded-2xl border border-border border-dashed bg-muted/20 p-6 text-center">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
          then — see it in anger
        </p>
        <p className="text-balance text-muted-foreground text-sm leading-relaxed">
          Pulse is a Twitch-style platform built specifically to <em>need</em>{" "}
          all of this. Watch the fundamentals turn into a real system, one phase
          at a time.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex items-center gap-1.5 rounded-pill border border-electric-yellow/50 bg-yellow-tint px-4 py-2 font-medium text-sm text-yellow-ink no-underline transition-colors hover:border-electric-yellow dark:bg-electric-yellow/10 dark:text-electric-yellow"
            href="/concepts"
          >
            Browse the concepts <ArrowRight className="size-3.5" />
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 rounded-pill border border-border px-4 py-2 font-medium text-foreground text-sm no-underline transition-colors hover:border-foreground/30"
            href="/"
          >
            See the roadmap <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  </FullBleed>
);
