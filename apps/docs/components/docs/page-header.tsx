import type { ReactNode } from "react";

/**
 * The polished page header shared across content pages — eyebrow + an oversized
 * display title (DevLab's tight tracking, `ds-mark` highlighter allowed inside
 * `title`). `not-prose` so it controls its own rhythm; the page's lead paragraph
 * follows as normal prose, which keeps inline code and links rendering correctly.
 *
 * Usage in MDX:
 *   <PageHeader eyebrow="Architecture · Phase 0"
 *     title={<>What runs, what's <span className="ds-mark">still planned</span></>} />
 */
export const PageHeader = ({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: ReactNode;
}) => (
  <header className="not-prose mb-9">
    <p className="ds-eyebrow">{eyebrow}</p>
    <h1 className="mt-4 text-balance font-bold text-4xl text-foreground leading-[1.05] tracking-[-0.025em] sm:text-5xl">
      {title}
    </h1>
  </header>
);
