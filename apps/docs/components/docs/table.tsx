import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * DevLab table treatment, mapped onto the raw markdown table elements in
 * `mdx-components.tsx` so every `| … |` table in an `.mdx` page renders styled
 * with no per-page work. Deliberately *not* `not-prose`: cells keep prose
 * styling for inline `code`, links, and bold, while these utility classes
 * override the typography plugin's zero-specificity defaults. The table's own
 * prose margin is zeroed so the bordered scroll container owns the spacing.
 *
 * That rounded, bordered scroll container keeps wide tables (long image tags,
 * port lists) usable on narrow screens. The container owns the vertical margin
 * (`my-6`); the table's own prose margin is zeroed in `globals.css` (unlayered,
 * because the typography plugin's table margin beats the `my-0` utility) so the
 * background-bearing header sits flush against the top border.
 */
export const Table = ({ className, ...props }: ComponentProps<"table">) => (
  <div className="my-6 overflow-x-auto rounded-2xl border border-border">
    <table
      className={cn("w-full border-collapse text-sm", className)}
      {...props}
    />
  </div>
);

export const Thead = (props: ComponentProps<"thead">) => (
  <thead className="bg-muted/50" {...props} />
);

export const Tr = ({ className, ...props }: ComponentProps<"tr">) => (
  <tr
    className={cn("border-border border-b last:border-0", className)}
    {...props}
  />
);

export const Th = ({ className, ...props }: ComponentProps<"th">) => (
  <th
    className={cn(
      "border-border border-b px-4 py-2.5 text-left align-bottom font-medium font-mono text-[11px] text-muted-foreground uppercase tracking-[0.08em]",
      className
    )}
    {...props}
  />
);

export const Td = ({ className, ...props }: ComponentProps<"td">) => (
  <td
    className={cn("px-4 py-3 align-top leading-relaxed", className)}
    {...props}
  />
);
