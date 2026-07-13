import type { ReactNode } from "react";

/**
 * The homepage's drafting sheet — the whole page sits on a ruled engineering
 * drawing: carbon surface, faint yellow drafting grid, a hairline frame. The
 * `dark` class scopes the semantic tokens (and every `dark:` variant) to
 * forced-dark for everything inside, regardless of the site theme — the
 * homepage is the one deliberately dark "lab" surface end to end. Everything
 * on the sheet (including the tiers and roadmap, which are built theme-aware)
 * renders dark here.
 */
export const HomeSheet = ({ children }: { children: ReactNode }) => (
  <div className="dark bg-carbon-900 text-foreground">
    <div
      /**
       * No border-top — the sticky header's bottom hairline already draws the
       * sheet's top edge; both would show as a double rule.
       */
      className="relative border-electric-yellow/20 border-x border-b outline-1 outline-electric-yellow/5 outline-offset-4"
      style={{
        backgroundImage:
          "linear-gradient(color-mix(in oklab, var(--color-electric-yellow) 4%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--color-electric-yellow) 4%, transparent) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {children}
    </div>
  </div>
);
