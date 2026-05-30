import { cn } from "@/lib/utils";

/**
 * Provenance for a derived page. The docs site is downstream of `docs/adr/` and
 * `CONTEXT.md` (ADR-0007), so every concept and architecture page declares the
 * sources it was translated from.
 *
 * ADRs are committed to the repo, so they render as links to the canonical
 * markdown on GitHub. The `.scratch/` issue tracker is gitignored and
 * local-only — its files would 404 for any reader but the maintainer — so
 * issues render as plain text labels, never hrefs. The lessons inside those
 * issues live in the prose above; this is only the breadcrumb back to source.
 */
const ADR_BLOB_BASE = "https://github.com/nass59/pulse/blob/main/docs/adr";

const ADR_INDEX: Record<number, { slug: string; title: string }> = {
  1: {
    slug: "0001-media-plane-outside-kafka",
    title: "Media plane outside Kafka",
  },
  2: { slug: "0002-polyglot-three-services", title: "Polyglot three services" },
  3: { slug: "0003-hybrid-source-of-truth", title: "Hybrid source of truth" },
  4: { slug: "0004-schema-strategy", title: "Schema strategy" },
  5: { slug: "0005-monorepo-orchestration", title: "Monorepo orchestration" },
  6: { slug: "0006-bun-as-js-runtime", title: "Bun as JS runtime" },
  7: {
    slug: "0007-docs-site-as-study-artifact",
    title: "Docs site as study artifact",
  },
  8: {
    slug: "0008-storybook-for-component-isolation",
    title: "Storybook for component isolation",
  },
};

const pad = (n: number) => String(n).padStart(4, "0");

interface SourcesProps {
  /** ADR numbers this page derives from, e.g. `[5, 7]`. */
  adrs?: number[];
  /** Local-only issue references, e.g. `"foundations/02-docker-compose"`. */
  issues?: string[];
}

export const Sources = ({ adrs = [], issues = [] }: SourcesProps) => (
  <aside
    className={cn("not-prose mt-12 rounded-lg border bg-muted/30 p-4 text-sm")}
  >
    <p className="font-medium">Sources</p>
    <p className="mt-1 text-muted-foreground text-xs">
      A derived study artifact. The canonical decisions live in the ADRs below;
      this page only translates them.
    </p>

    {adrs.length > 0 && (
      <div className="mt-3">
        <span className="text-muted-foreground text-xs">ADRs</span>
        <ul className="mt-1 flex flex-col gap-1">
          {adrs.map((n) => {
            const adr = ADR_INDEX[n];
            return (
              <li key={n}>
                <a
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  href={`${ADR_BLOB_BASE}/${adr?.slug ?? pad(n)}.md`}
                  rel="noreferrer"
                  target="_blank"
                >
                  ADR-{pad(n)}
                </a>
                {adr ? (
                  <span className="text-muted-foreground"> — {adr.title}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    )}

    {issues.length > 0 && (
      <div className="mt-3">
        <span className="text-muted-foreground text-xs">
          Issues (local-only tracker)
        </span>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {issues.map((issue) => (
            <li
              className="rounded border bg-background px-1.5 py-0.5 font-mono text-muted-foreground text-xs"
              key={issue}
            >
              {issue}
            </li>
          ))}
        </ul>
      </div>
    )}
  </aside>
);
