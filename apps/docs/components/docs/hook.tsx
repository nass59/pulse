import { IconBolt } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The "why you'll hit this" opener on every concept page — the one-line,
 * Pulse-flavoured grab that lands right under the `PageHeader`, before the
 * explanation proper (the concept-page motif from `AGENTS.md`'s reader-facing
 * voice). It replaces the markdown `>` blockquote the early pages used, so the
 * hook reads as a deliberate, repeating element rather than an incidental quote.
 *
 * DevLab grammar: mono UPPERCASE label, a jolt icon, an accent wash. `tone`
 * picks the accent: the default `kafka` (electric-yellow) for concept pages, and
 * `go` (Go blue, `--color-go-blue`) for the `/go` tier — the per-technology
 * accent from ADR-0020, so a hook reads as "this is a Go idea." `not-prose` so
 * it owns its rhythm; `ds-rich` so inline `code` in the line renders as a chip.
 *
 * Usage in MDX:
 *   <Hook>the first time you run `docker compose up`, Kafka isn't ready…</Hook>
 *   <Hook tone="go">a goroutine per connection sounds reckless — it isn't.</Hook>
 */
const TONES = {
  kafka: {
    shell:
      "border-electric-yellow/40 bg-yellow-tint dark:border-electric-yellow/20 dark:bg-electric-yellow/[0.06]",
    chip: "bg-electric-yellow/15 text-yellow-ink dark:text-electric-yellow",
    label: "text-yellow-ink dark:text-electric-yellow",
  },
  go: {
    shell:
      "border-go-blue/40 bg-go-tint dark:border-go-blue/25 dark:bg-go-blue/[0.07]",
    chip: "bg-go-blue/15 text-go-ink dark:text-go-blue",
    label: "text-go-ink dark:text-go-blue",
  },
  /** O'Reilly red for the /distributed-systems pillar (ADR-0025). */
  systems: {
    shell:
      "border-systems-red/40 bg-systems-tint dark:border-systems-red/25 dark:bg-systems-red/[0.07]",
    chip: "bg-systems-red/15 text-systems-ink dark:text-systems-red",
    label: "text-systems-ink dark:text-systems-red",
  },
} as const;

export const Hook = ({
  children,
  tone = "kafka",
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
}) => {
  const t = TONES[tone];
  return (
    <aside
      className={cn(
        "not-prose my-8 flex items-start gap-3.5 rounded-2xl border p-5",
        t.shell
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          t.chip
        )}
      >
        <IconBolt className="size-4.5" />
      </span>
      <div className="ds-rich">
        <p
          className={cn(
            "font-medium font-mono text-[11px] uppercase tracking-[0.1em]",
            t.label
          )}
        >
          Why you'll hit this
        </p>
        {/*
         * A `div`, not a `p`: MDX wraps block children in their own `<p>`, and a
         * `<p>` inside a `<p>` is invalid HTML (hydration error). The text styles
         * inherit into that inner paragraph; `[&_p]:m-0` keeps its rhythm.
         */}
        <div className="mt-1.5 text-base text-foreground leading-relaxed [&_p]:m-0">
          {children}
        </div>
      </div>
    </aside>
  );
};
