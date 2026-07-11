import type { LucideIcon } from "lucide-react";
import { Gauge, Info, Lightbulb, Sparkles, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A boxed aside, rendered in DevLab's callout language: a tinted box, a 1px
 * border, a line icon, and a mono UPPERCASE label naming the *kind* of
 * knowledge. The variant taxonomy is Pulse-tuned — DevLab's visual grammar
 * carrying distributed-systems semantics rather than its frontend-flavoured
 * defaults (ADR-0009):
 *
 * - `note`    — neutral framing aside (the default)
 * - `key`     — the central idea of the page (Key Concept)
 * - `perf`    — a tuning / throughput consideration (Performance Note)
 * - `lesson`  — the why-trail, a lesson the build taught (Lesson Learned)
 * - `footgun` — the thing that bites you in production (Footgun in Production)
 */
type Variant = "note" | "key" | "perf" | "lesson" | "footgun";

const VARIANTS: Record<
  Variant,
  { icon: LucideIcon; label: string; box: string; accent: string }
> = {
  note: {
    icon: Info,
    label: "Note",
    box: "border-border bg-muted/40",
    accent: "text-foreground/70",
  },
  key: {
    icon: Lightbulb,
    label: "Key Concept",
    box: "border-electric-yellow/40 bg-yellow-tint dark:border-electric-yellow/20 dark:bg-electric-yellow/[0.06]",
    accent: "text-yellow-ink dark:text-electric-yellow",
  },
  perf: {
    icon: Gauge,
    label: "Performance Note",
    box: "border-border bg-muted/50",
    accent: "text-olive",
  },
  lesson: {
    icon: Sparkles,
    label: "Lesson Learned",
    box: "border-electric-yellow/40 bg-yellow-tint dark:border-electric-yellow/20 dark:bg-electric-yellow/[0.06]",
    accent: "text-yellow-ink dark:text-electric-yellow",
  },
  footgun: {
    icon: TriangleAlert,
    label: "Footgun in Production",
    box: "border-destructive/30 bg-destructive/[0.05] dark:bg-destructive/[0.1]",
    accent: "text-destructive",
  },
};

type CalloutProps = {
  children: ReactNode;
  /** Overrides the default variant label. */
  title?: string;
  variant?: Variant;
};

export const Callout = ({
  variant = "note",
  title,
  children,
}: CalloutProps) => {
  const v = VARIANTS[variant];
  const Icon = v.icon;
  return (
    <div
      className={cn(
        "not-prose my-6 flex gap-3.5 rounded-2xl border p-5",
        v.box
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", v.accent)} />
      <div>
        <p
          className={cn(
            "font-medium font-mono text-xs uppercase tracking-[0.08em]",
            v.accent
          )}
        >
          {title ?? v.label}
        </p>
        <div className="ds-rich mt-2 text-foreground/90 text-sm leading-relaxed [&>p:first-child]:mt-0 [&>p]:mt-2">
          {children}
        </div>
      </div>
    </div>
  );
};
