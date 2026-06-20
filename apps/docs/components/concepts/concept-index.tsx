import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Eyebrow } from "@/components/docs/eyebrow";
import { FullBleed } from "@/components/docs/full-bleed";
import { COMING_CONCEPTS, type Concept, LIVE_CONCEPTS } from "@/lib/concepts";
import { cn } from "@/lib/utils";

/**
 * The Concepts browse surface — the catalogue you scan to pick what to read
 * next. Richer than the homepage roadmap teaser (per-concept icons, an
 * interactive badge), but driven by the same `lib/concepts.ts` data and the same
 * build-state honesty: `live` concepts link out; `coming` ones are dashed,
 * dimmed, and unlinked.
 */
const IconTile = ({ concept, live }: { concept: Concept; live: boolean }) => {
  const Icon = concept.icon;
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
        live
          ? "border-electric-yellow/30 bg-electric-yellow/10 text-yellow-ink group-hover/card:border-electric-yellow/60 dark:text-electric-yellow"
          : "border-border border-dashed text-muted-foreground"
      )}
    >
      <Icon className="size-5" />
    </span>
  );
};

const InteractiveBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-pill border border-accent-purple/40 px-2 py-0.5 font-medium font-mono text-[10px] text-accent-purple uppercase tracking-[0.08em]">
    <Sparkles className="size-2.5" />
    interactive
  </span>
);

const LiveCard = ({ concept }: { concept: Concept }) => (
  <Link
    className="group/card flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-electric-yellow/50 hover:shadow-md sm:p-6 dark:hover:shadow-glow-sm"
    href={concept.href ?? "#"}
  >
    <div className="flex items-start justify-between gap-3">
      <IconTile concept={concept} live />
      <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:text-foreground" />
    </div>
    <h3 className="mt-4 flex flex-wrap items-center gap-2 font-semibold text-foreground text-lg tracking-[-0.01em]">
      {concept.title}
      {concept.interactive && <InteractiveBadge />}
    </h3>
    <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
      {concept.blurb}
    </p>
  </Link>
);

const ComingCard = ({ concept }: { concept: Concept }) => (
  <div className="flex flex-col rounded-2xl border border-border border-dashed bg-transparent p-5 opacity-80">
    <div className="flex items-start justify-between gap-3">
      <IconTile concept={concept} live={false} />
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

export const ConceptIndex = () => (
  <FullBleed>
    <section className="mx-auto max-w-4xl px-6 py-4">
      <Eyebrow>Concepts · Phase 1 live</Eyebrow>
      <h1 className="mt-4 font-bold text-4xl text-foreground tracking-[-0.025em] sm:text-5xl">
        The ideas, <span className="ds-mark">one page</span> each
      </h1>
      <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
        The distributed-systems ideas the build keeps shoving in your face —
        explained the way a friend would over coffee, with a diagram instead of
        a wall of text wherever one earns its place.
      </p>
      <p className="mt-3 max-w-2xl text-balance text-muted-foreground text-sm leading-relaxed">
        Phase 0 stood up the infrastructure; Phase 1 started pushing real events
        through it. The first service emits a stream lifecycle, and the chat
        gateway both produces messages and consumes that lifecycle back — so
        partitions, ordering, consumer groups, and server-authored events are
        live now, not theory.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {LIVE_CONCEPTS.map((concept) => (
          <LiveCard concept={concept} key={concept.title} />
        ))}
      </div>

      <div className="mt-12 flex items-center gap-3">
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.12em]">
          On the roadmap
        </p>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMING_CONCEPTS.map((concept) => (
          <ComingCard concept={concept} key={concept.title} />
        ))}
      </div>
    </section>
  </FullBleed>
);
