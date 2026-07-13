import {
  IconArrowRight,
  IconBoxMultiple,
  IconMap,
  type TablerIcon,
} from "@tabler/icons-react";
import Link from "next/link";

import { Eyebrow } from "@/components/docs/eyebrow";
import { FullBleed } from "@/components/docs/full-bleed";

/**
 * The Build hub landing (ADR-0021) — the cross-cutting area that isn't one
 * technology pillar. It collapses the former top-level `Architecture` and
 * `Journey` tiers (which were always the same kind of thing: the system, and the
 * story of building it) into one entry, and is home to the infra concepts that
 * belong to the running system rather than a language. Static server component,
 * Kafka-yellow accent — The Build is Pulse's own surface, not a guest technology.
 */
type Area = {
  blurb: string;
  href: string;
  icon: TablerIcon;
  title: string;
};

const AREAS: Area[] = [
  {
    title: "Architecture",
    blurb:
      "The system topology and the infrastructure under it — what runs, what talks to what, and what's still on the drawing board. Healthchecks and named volumes live here too.",
    href: "/build/architecture",
    icon: IconBoxMultiple,
  },
  {
    title: "Journey",
    blurb:
      "The build by phase: lessons unlocked, issues closed, and the runnable proofs for each epic — foundations, identity, and chat so far.",
    href: "/build/journey/foundations",
    icon: IconMap,
  },
];

export const BuildHub = () => (
  <FullBleed>
    <section className="mx-auto max-w-4xl px-6 py-4">
      <Eyebrow>The Build · the system that ties it together</Eyebrow>
      <h1 className="mt-4 text-balance font-bold text-4xl text-foreground tracking-[-0.025em] sm:text-5xl">
        Pulse itself, <span className="ds-mark">end to end</span>
      </h1>
      <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground leading-relaxed">
        The pillars teach the technologies; this is where they meet. Everything
        here is about the whole Pulse build, not one language — the running
        system and the story of getting it there.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {AREAS.map((area) => {
          const Icon = area.icon;
          return (
            <Link
              className="group/card flex flex-col rounded-2xl border border-border bg-card p-6 no-underline transition-all hover:-translate-y-0.5 hover:border-electric-yellow/50 hover:shadow-md dark:hover:shadow-glow-sm"
              href={area.href}
              key={area.href}
            >
              <Icon className="size-5 text-yellow-ink dark:text-electric-yellow" />
              <h3 className="mt-4 flex items-center gap-1.5 font-semibold text-foreground text-lg tracking-[-0.01em]">
                {area.title}
                <IconArrowRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover/card:translate-x-0.5 group-hover/card:opacity-100" />
              </h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                {area.blurb}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  </FullBleed>
);
