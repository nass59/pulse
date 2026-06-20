import { ArrowRight, Check, Terminal } from "lucide-react";
import Link from "next/link";

import { Eyebrow } from "@/components/docs/eyebrow";
import { FullBleed } from "@/components/docs/full-bleed";
import { GO_STEPS, type GoStep } from "@/lib/go";

/**
 * The `Go` track index (ADR-0020) — a linear "Go for a TypeScript engineer"
 * path. Static server component, same shape as the `Learn` index, but themed in
 * Go blue (`--color-go-blue`) rather than electric-yellow: the per-technology
 * accent that marks a surface as being about Go-the-language. Each step is `live`
 * from day one — the track teaches the language, so it isn't build-state-gated.
 */
const StepCard = ({ step, n }: { step: GoStep; n: number }) => {
  const Icon = step.icon;
  return (
    <Link
      className="group/step relative flex gap-5 rounded-2xl border border-border bg-card p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-go-blue/50 hover:shadow-md sm:gap-7 sm:p-6 dark:hover:shadow-glow-go-sm"
      href={step.href}
    >
      <div className="flex shrink-0 flex-col items-center gap-3">
        <span className="font-bold text-4xl text-muted-foreground/25 tabular-nums leading-none sm:text-5xl">
          0{n}
        </span>
        <span className="flex size-10 items-center justify-center rounded-xl border border-go-blue/30 bg-go-blue/10 text-go-ink dark:text-go-blue">
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
              <Check className="mt-0.5 size-3 shrink-0 text-go-blue" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
};

export const GoPath = () => (
  <FullBleed>
    <section className="mx-auto max-w-3xl px-6 py-4">
      <Eyebrow>Go · for a TypeScript brain</Eyebrow>
      <h1 className="mt-4 text-balance font-bold text-4xl text-foreground tracking-[-0.025em] sm:text-5xl">
        Go, explained from <span className="ds-mark-go">TypeScript</span>
      </h1>
      <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
        A short, linear path for an engineer fluent in TypeScript and new to Go.
        No tour of the whole language — just the handful of ideas you need to
        read the{" "}
        <code className="font-mono text-base text-foreground">chat</code>{" "}
        gateway and feel why Go fits a service holding thousands of live
        connections.
      </p>

      <div className="mt-5 inline-flex items-start gap-2.5 rounded-2xl border border-go-blue/30 bg-go-blue/[0.05] px-4 py-3">
        <Terminal className="mt-0.5 size-4 shrink-0 text-go-blue" />
        <p className="text-foreground/80 text-sm leading-relaxed">
          This track teaches{" "}
          <span className="font-medium text-foreground">Go the language</span> —
          the snippets are real lines from Pulse's{" "}
          <span className="font-medium text-foreground">chat</span> service. For
          what those events <em>mean</em> on the Kafka side, the{" "}
          <Link
            className="font-medium text-foreground underline decoration-2 decoration-go-blue underline-offset-2"
            href="/concepts"
          >
            Concepts
          </Link>{" "}
          tier is the other half of the story.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4">
        {GO_STEPS.map((step, i) => (
          <StepCard key={step.href} n={i + 1} step={step} />
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-3 rounded-2xl border border-border border-dashed bg-muted/20 p-6 text-center">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
          then — see it run
        </p>
        <p className="text-balance text-muted-foreground text-sm leading-relaxed">
          The gateway these pages dissect is real and runnable. Watch it accept
          a socket, fan out a message, and stamp a server-authored event onto
          the log.
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-3">
          <Link
            className="inline-flex items-center gap-1.5 rounded-pill border border-go-blue/50 bg-go-tint px-4 py-2 font-medium text-go-ink text-sm no-underline transition-colors hover:border-go-blue dark:bg-go-blue/10 dark:text-go-blue"
            href="/journey/chat"
          >
            Run the chat gateway <ArrowRight className="size-3.5" />
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 rounded-pill border border-border px-4 py-2 font-medium text-foreground text-sm no-underline transition-colors hover:border-foreground/30"
            href="/concepts/server-authored-events"
          >
            What the events mean <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  </FullBleed>
);
