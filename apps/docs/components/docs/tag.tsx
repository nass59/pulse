import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A pill tag — DevLab's two tag flavours in one component. Editorial contexts
 * hash-prefix the label (`#Kafka`); browse contexts pair a line icon with a
 * label (`Intermediate`). Category accents (blue/purple/green/orange) appear
 * only as small signifiers — the icon and the hairline border — never as fills.
 */
type Accent = "neutral" | "yellow" | "blue" | "purple" | "green" | "orange";

const ACCENTS: Record<Accent, string> = {
  neutral: "border-border text-muted-foreground",
  yellow: "border-electric-yellow/40 text-yellow-ink dark:text-electric-yellow",
  blue: "border-accent-blue/40 text-accent-blue",
  purple: "border-accent-purple/40 text-accent-purple",
  green: "border-accent-green/40 text-accent-green",
  orange: "border-accent-orange/40 text-accent-orange",
};

type TagProps = {
  /** Category signifier colour. Defaults to neutral. */
  accent?: Accent;
  children: ReactNode;
  className?: string;
  /** Prefix the label with `#` (editorial context). */
  hash?: boolean;
  /** Optional leading line icon (browse-context pills). */
  icon?: LucideIcon;
};

export const Tag = ({
  children,
  icon: Icon,
  accent = "neutral",
  hash = false,
  className,
}: TagProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-pill border bg-transparent px-2.5 py-0.5 font-medium font-mono text-xs",
      ACCENTS[accent],
      className
    )}
  >
    {Icon ? <Icon className="size-3.5" /> : null}
    {hash ? <span className="opacity-60">#</span> : null}
    {children}
  </span>
);
