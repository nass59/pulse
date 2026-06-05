import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { COMING_CONCEPTS, type Concept, LIVE_CONCEPTS } from "@/lib/concepts";
import { cn } from "@/lib/utils";

/**
 * The learning arc, shown whole but honest about build state — the same rule
 * `<SystemTopology>` follows. `live` concepts have a page and link out; `coming`
 * concepts are dashed and dimmed with no link, so the homepage never promises a
 * page that hasn't shipped (see `AGENTS.md`, build-state honesty). The catalogue
 * itself lives in `lib/concepts.ts`, shared with the Concepts index.
 */
const Card = ({ concept }: { concept: Concept }) => {
  const live = Boolean(concept.href);
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-medium font-mono text-[10px] uppercase tracking-[0.1em]",
            live
              ? "text-yellow-ink dark:text-electric-yellow"
              : "text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "inline-block size-1.5 rounded-full",
              live ? "bg-electric-yellow" : "bg-muted-foreground/50"
            )}
          />
          {live ? "live" : "coming"}
        </span>
        {live && (
          <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:text-foreground" />
        )}
      </div>
      <h3
        className={cn(
          "mt-3 font-semibold text-base tracking-[-0.01em]",
          live ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {concept.title}
      </h3>
      <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
        {concept.blurb}
      </p>
    </>
  );

  const base =
    "group/card block rounded-2xl border p-5 text-left transition-all";

  if (live && concept.href) {
    return (
      <Link
        className={cn(
          base,
          "border-border bg-card hover:-translate-y-0.5 hover:border-electric-yellow/50 hover:shadow-md dark:hover:shadow-glow-sm"
        )}
        href={concept.href}
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        base,
        "border-border border-dashed bg-transparent opacity-75"
      )}
    >
      {body}
    </div>
  );
};

export const ConceptRoadmap = () => (
  <section className="mx-auto max-w-5xl px-6 py-20">
    <div className="max-w-2xl">
      <p className="ds-eyebrow">The arc</p>
      <h2 className="mt-3 font-bold text-3xl text-foreground tracking-[-0.02em] sm:text-4xl">
        Concepts to learn
      </h2>
      <p className="mt-4 text-balance text-muted-foreground leading-relaxed">
        Each one is a page that earns its place by being built first. The live
        ones are written; the rest land as the services that force them come
        online — no faking what isn't running yet.
      </p>
    </div>

    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {LIVE_CONCEPTS.map((c) => (
        <Card concept={c} key={c.title} />
      ))}
    </div>

    <p className="mt-10 mb-4 font-mono text-muted-foreground text-xs uppercase tracking-[0.12em]">
      On the roadmap
    </p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {COMING_CONCEPTS.map((c) => (
        <Card concept={c} key={c.title} />
      ))}
    </div>
  </section>
);
