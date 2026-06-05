import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Escapes the shared `max-w-3xl` / `.prose` article wrapper from `layout.tsx`
 * so a section can span the full viewport width. The body carries
 * `overflow-x-clip` (see `layout.tsx`) so `100vw` never induces a horizontal
 * scrollbar. Inner content re-centres itself with its own max-width.
 */
export const FullBleed = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "not-prose relative left-1/2 w-screen -translate-x-1/2",
      className
    )}
  >
    {children}
  </div>
);
