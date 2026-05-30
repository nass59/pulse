import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A boxed aside for the three recurring shapes of note in the docs: a neutral
 * framing note, an operational warning, and a "footgun in production" flag. No
 * icon library dependency — a coloured rail and a label carry the variant.
 */
type Variant = "note" | "warning" | "footgun";

const VARIANTS: Record<
  Variant,
  { rail: string; tint: string; label: string; labelColor: string }
> = {
  note: {
    rail: "border-l-sky-400",
    tint: "bg-sky-50",
    label: "Note",
    labelColor: "text-sky-700",
  },
  warning: {
    rail: "border-l-amber-400",
    tint: "bg-amber-50",
    label: "Lesson learned",
    labelColor: "text-amber-700",
  },
  footgun: {
    rail: "border-l-red-400",
    tint: "bg-red-50",
    label: "Footgun in production",
    labelColor: "text-red-700",
  },
};

interface CalloutProps {
  children: ReactNode;
  /** Overrides the default variant label. */
  title?: string;
  variant?: Variant;
}

export const Callout = ({
  variant = "note",
  title,
  children,
}: CalloutProps) => {
  const v = VARIANTS[variant];
  return (
    <div
      className={cn(
        "not-prose my-5 rounded-r-lg border border-l-4 p-4",
        v.rail,
        v.tint
      )}
    >
      <p
        className={cn(
          "font-semibold text-xs uppercase tracking-wide",
          v.labelColor
        )}
      >
        {title ?? v.label}
      </p>
      <div className="mt-1.5 text-foreground/90 text-sm [&>p:first-child]:mt-0 [&>p]:mt-2">
        {children}
      </div>
    </div>
  );
};
