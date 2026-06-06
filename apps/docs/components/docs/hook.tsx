import { Zap } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The "why you'll hit this" opener on every concept page — the one-line,
 * Pulse-flavoured grab that lands right under the `PageHeader`, before the
 * explanation proper (the concept-page motif from `AGENTS.md`'s reader-facing
 * voice). It replaces the markdown `>` blockquote the early pages used, so the
 * hook reads as a deliberate, repeating element rather than an incidental quote.
 *
 * DevLab grammar: electric-yellow accent, mono UPPERCASE label, a jolt icon.
 * `not-prose` so it owns its rhythm; `ds-rich` so inline `code` in the line
 * still renders as a chip.
 *
 * Usage in MDX:
 *   <Hook>the first time you run `docker compose up`, Kafka isn't ready for a
 *   few seconds — and you'll wonder why.</Hook>
 */
export const Hook = ({ children }: { children: ReactNode }) => (
  <aside className="not-prose my-8 flex items-start gap-3.5 rounded-2xl border border-electric-yellow/40 bg-yellow-tint p-5 dark:border-electric-yellow/20 dark:bg-electric-yellow/[0.06]">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-electric-yellow/15 text-yellow-ink dark:text-electric-yellow">
      <Zap className="size-4.5" />
    </span>
    <div className="ds-rich">
      <p className="font-medium font-mono text-[11px] text-yellow-ink uppercase tracking-[0.1em] dark:text-electric-yellow">
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
