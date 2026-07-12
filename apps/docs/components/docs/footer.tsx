import { Logo } from "@/components/brand/logo";

/**
 * Editorial footer. Keeps the study-artifact framing visible at the bottom of
 * every page: the canonical sources are the ADRs and `CONTEXT.md`, not here.
 */
export const Footer = () => (
  <footer className="border-border border-t">
    <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
      <Logo />
      <p className="ds-meta max-w-md text-muted-foreground text-xs leading-relaxed">
        A derived study artifact for the Pulse Kafka-learning project. The
        canonical decisions live in <code className="font-mono">docs/adr/</code>{" "}
        and <code className="font-mono">CONTEXT.md</code>; when this site
        disagrees, they win.
      </p>
    </div>
  </footer>
);
