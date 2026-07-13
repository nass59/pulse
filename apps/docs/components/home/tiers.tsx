import type { TablerIcon } from "@tabler/icons-react";
import {
  IconArrowRight,
  IconLayersIntersect,
  IconRoute,
  IconSitemap,
} from "@tabler/icons-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type Accent = "kafka" | "go" | "kotlin";

type Pillar = {
  accent: Accent;
  blurb: string;
  href: string;
  icon: TablerIcon;
  title: string;
};

/**
 * The three learning pillars as navigation cards (ADR-0021). Each carries its
 * own per-technology accent (yellow / blue / purple) so the homepage previews
 * the colour system the pillars use. The Build lives in the header nav, not here
 * — these cards are specifically "the three things I'm learning."
 */
const PILLARS: Pillar[] = [
  {
    title: "Kafka",
    blurb:
      "The backbone. From zero — the log, partitions, consumer groups — to the patterns Pulse runs on top: the outbox, server-authored events, schema evolution.",
    href: "/kafka",
    icon: IconSitemap,
    accent: "kafka",
  },
  {
    title: "Go",
    blurb:
      "The gateway language. Errors as values, a goroutine per connection, and a cgo-backed Kafka client — the ideas behind the chat service that holds thousands of live sockets.",
    href: "/go",
    icon: IconRoute,
    accent: "go",
  },
  {
    title: "Kotlin",
    blurb:
      "Stream processing, live. The analytics service on Kafka Streams — hopping windows and state stores computing the viewer count you watched tick above.",
    href: "/kotlin",
    icon: IconLayersIntersect,
    accent: "kotlin",
  },
];

const ACCENT: Record<Accent, { icon: string; hover: string }> = {
  kafka: {
    icon: "text-yellow-ink dark:text-electric-yellow",
    hover: "hover:border-electric-yellow/50 dark:hover:shadow-glow-sm",
  },
  go: {
    icon: "text-go-ink dark:text-go-blue",
    hover: "hover:border-go-blue/50 dark:hover:shadow-glow-go-sm",
  },
  kotlin: {
    icon: "text-kotlin-ink dark:text-kotlin-purple",
    hover: "hover:border-kotlin-purple/50 dark:hover:shadow-glow-kotlin-sm",
  },
};

/**
 * The three learning pillars as navigation cards — the homepage's
 * end-of-journey fan-out: by the time a reader reaches these, they've ridden
 * the loop and can pick a track with context. Server component.
 */
export const Tiers = () => (
  <section className="mx-auto max-w-5xl px-6 py-16">
    <p className="font-medium font-mono text-[11px] text-olive uppercase tracking-[0.14em]">
      {"// where to, from here"}
    </p>
    <h2 className="mt-3 mb-9 font-bold text-3xl text-foreground tracking-[-0.02em] sm:text-4xl">
      Pick up the story where it interests you.
    </h2>
    <div className="grid gap-4 md:grid-cols-3">
      {PILLARS.map((pillar) => {
        const Icon = pillar.icon;
        const a = ACCENT[pillar.accent];
        return (
          <Link
            className={cn(
              "group/tier flex flex-col rounded-2xl border border-border bg-card p-6 transition-[translate,border-color,box-shadow] hover:-translate-y-0.5 hover:shadow-md",
              a.hover
            )}
            href={pillar.href}
            key={pillar.href}
          >
            <Icon className={cn("size-5", a.icon)} />
            <h3 className="mt-4 flex items-center gap-1.5 font-semibold text-foreground text-lg tracking-[-0.01em]">
              {pillar.title}
              <IconArrowRight className="size-4 text-muted-foreground opacity-0 transition-[translate,opacity] group-hover/tier:translate-x-0.5 group-hover/tier:opacity-100" />
            </h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              {pillar.blurb}
            </p>
          </Link>
        );
      })}
    </div>
  </section>
);
