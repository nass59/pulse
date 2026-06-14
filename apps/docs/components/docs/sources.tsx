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
  9: {
    slug: "0009-devlab-design-system",
    title: "DevLab design system",
  },
  10: {
    slug: "0010-mdx-rendering-pipeline",
    title: "MDX rendering pipeline",
  },
  11: {
    slug: "0011-learn-track-general-kafka",
    title: "Learn track — general Kafka pedagogy",
  },
  12: {
    slug: "0012-stream-lifecycle-topic-topology",
    title: "Stream lifecycle topic topology",
  },
  13: {
    slug: "0013-in-process-polling-outbox-relay",
    title: "In-process polling outbox relay",
  },
  14: {
    slug: "0014-murmur2-partitioning-across-producers",
    title: "murmur2 partitioning across producers",
  },
};

const pad = (n: number) => String(n).padStart(4, "0");

interface ExternalRef {
  href: string;
  label: string;
}

interface SourcesProps {
  /** ADR numbers this page derives from, e.g. `[5, 7]`. */
  adrs?: number[];
  /** Local-only issue references, e.g. `"foundations/02-docker-compose"`. */
  issues?: string[];
  /**
   * Outward-pointing references for the `Learn` tier — pages that translate a
   * public technology rather than an internal decision, so they cite the
   * canonical external docs instead of (or alongside) an ADR (ADR-0011).
   */
  refs?: ExternalRef[];
}

export const Sources = ({
  adrs = [],
  issues = [],
  refs = [],
}: SourcesProps) => (
  <details
    className={cn(
      "not-prose group mt-14 rounded-2xl border border-border bg-card/60 text-sm"
    )}
  >
    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-3.5 text-muted-foreground hover:text-foreground">
      <span className="ds-eyebrow">Sources &amp; provenance</span>
      <span className="font-mono text-[11px] transition-transform group-open:rotate-90">
        ›
      </span>
    </summary>
    <div className="px-5 pb-5">
      <p className="text-muted-foreground text-xs leading-relaxed">
        {adrs.length === 0 && issues.length === 0 && refs.length > 0
          ? "This page teaches Kafka the technology, not Pulse — so its sources point outward, to the canonical write-ups it's distilled from."
          : "This page is a study artifact — it translates decisions recorded elsewhere in the repo. The canonical write-ups live below; when they disagree with this page, they win."}
      </p>

      {adrs.length > 0 && (
        <div className="mt-4">
          <span className="ds-eyebrow text-[10px]">ADRs</span>
          <ul className="mt-1.5 flex flex-col gap-1">
            {adrs.map((n) => {
              const adr = ADR_INDEX[n];
              return (
                <li key={n}>
                  <a
                    className="font-medium text-foreground underline decoration-2 decoration-electric-yellow underline-offset-2 hover:decoration-[3px]"
                    href={`${ADR_BLOB_BASE}/${adr?.slug ?? pad(n)}.md`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    ADR-{pad(n)}
                  </a>
                  {adr ? (
                    <span className="text-muted-foreground">
                      {" "}
                      — {adr.title}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {issues.length > 0 && (
        <div className="mt-4">
          <span className="ds-eyebrow text-[10px]">
            Issues (local-only tracker)
          </span>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {issues.map((issue) => (
              <li
                className="rounded-pill border border-border bg-muted px-2.5 py-0.5 font-mono text-muted-foreground text-xs"
                key={issue}
              >
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {refs.length > 0 && (
        <div className="mt-4">
          <span className="ds-eyebrow text-[10px]">Further reading</span>
          <ul className="mt-1.5 flex flex-col gap-1">
            {refs.map((ref) => (
              <li key={ref.href}>
                <a
                  className="font-medium text-foreground underline decoration-2 decoration-electric-yellow underline-offset-2 hover:decoration-[3px]"
                  href={ref.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {ref.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </details>
);
