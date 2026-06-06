<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Storybook MCP

When working on UI components, always use the `pulse-sb` MCP tools to access Storybook's component and documentation knowledge before answering or taking any action.

- **CRITICAL: Never hallucinate component properties!** Before using ANY property on a component from a design system (including common-sounding ones like `shadow`, etc.), you MUST use the MCP tools to check if the property is actually documented for that component.
- Query `list-all-documentation` to get a list of all components
- Query `get-documentation` for that component to see all available properties and examples
- Only use properties that are explicitly documented or shown in example stories
- If a property isn't documented, do not assume properties based on naming conventions or common patterns from other libraries. Check back with the user in these cases.
- Use the `get-storybook-story-instructions` tool to fetch the latest instructions for creating or updating stories. This will ensure you follow current conventions and recommendations.
- Check your work by running `run-story-tests`.

Remember: A story name might not reflect the property name correctly, so always verify properties through documentation or example stories before using them.

# Docs content conventions

Conventions established during the first per-epic content pass (foundations v0, docs-site issue 03). Follow them on every later epic update; they are downstream of [ADR-0007](../../docs/adr/0007-docs-site-as-study-artifact.md), not new decisions.

- **Provenance via `<Sources>`, not YAML frontmatter.** `@next/mdx` here has no `remark-frontmatter` wired, and the repo's frontmatter idiom is ESM `export const metadata`. Every concept and architecture page ends with a `<Sources adrs={[…]} issues={[…]} />` component (registered globally in `mdx-components.tsx`). It is the single source of truth for provenance and renders it visibly on-page.
- **ADRs link, `.scratch/` issues are labels.** ADRs are committed, so `<Sources adrs>` renders them as links to the canonical markdown on GitHub (`ADR_INDEX` in `components/docs/sources.tsx` maps number → slug; add new ADRs there). The `.scratch/` tracker is gitignored and local-only — its files 404 for anyone but the maintainer — so `issues` render as plain text labels, never hrefs.
- **Build-state honesty in diagrams.** `<SystemTopology>` encodes `live` (running today) vs `planned` (designed, not built) nodes, and keeps edges dashed until a service exists to drive them. Each epic flips a node — and its edges — from planned to live. Don't draw a node as live before its service ships.
- **Don't invent architecture.** Widgets and prose translate decisions already recorded in `docs/adr/` and `CONTEXT.md`. If a widget would be richer by depicting infrastructure Pulse doesn't run (e.g. a multi-voter KRaft quorum when Pulse runs single-node), explain the concept in prose instead of animating the un-built system. If a decision crystallises while writing docs, that's an ADR first, then a docs update.
- **Interactive widgets earn their bytes (dynamics-shaped filter, ADR-0007).** A concept gets an interactive component only if it is a flow over time, a parameter space with a visible effect, or a topology worth exploring. Declarative concepts ship as prose. Every interactive widget gets a Storybook story (ADR-0008).

## Reader-facing voice (established docs-site v1 polish pass, 2026-06-05)

A second polish pass tuned the *reading experience* without changing what the site is. These are voice/surface conventions, still downstream of [ADR-0007](../../docs/adr/0007-docs-site-as-study-artifact.md) (the site stays a derived study artifact that tracks the build — positioning unchanged, no ADR amendment). Resolved in a `grill-with-docs` run.

- **Write like a friend explaining it, not a spec.** Lead with a concrete, often Pulse-flavoured analogy or scenario; keep paragraphs short; prefer one good diagram over three paragraphs. The model is hellointerview's "A Motivating Example." Precision is non-negotiable — friendly never means hand-wavy — but the default register is warm and plain.
- **No "ADR" in the prose flow.** The reader never reads "see ADR-0007" mid-sentence. Provenance still ships on every page, but only in the `<Sources>` block at the very bottom (now collapsed by default via `<details>`), so the reading surface is clean and the breadcrumb-back-to-source survives for anyone who wants it. (This refines, not revokes, the `<Sources>` convention above.)
- **Motivating example lives on the homepage.** One strong animated narrative — the livestream firehose (a creator goes live, viewers flood the Channel, chat becomes a firehose) — anchors the homepage. It uses canonical `CONTEXT.md` terms (Stream, Channel, control/media plane); "firehose" is an analogy, deliberately *not* a glossary term. Concept pages get a single one-line "why you'd hit this" hook, not a repeated full scenario.
- **Build-state honesty extends to the concept roadmap.** The homepage shows the whole learning arc, but every concept card is marked `live` (links to its page) or `coming` (dimmed/dashed, no link) — the same honesty rule as `<SystemTopology>`. Don't link a concept page before it ships.
- **Diagrams everywhere, animation still gated.** Static SVG diagrams are cheap and the primary memorability tool — use them freely (`components/docs/diagram.tsx` holds the shared frame + the per-concept static figures; static server components, no client boundary). Interactive/animated widgets still must pass the dynamics-shaped filter above; the v1 pass added none, only static figures.

## Rendering & page-skeleton conventions (established docs-site v2 pass, 2026-06-05)

A third pass fixed how content *renders* and made every content page share one skeleton. These are downstream of [ADR-0010](../../docs/adr/0010-mdx-rendering-pipeline.md) (the MDX pipeline) and ADR-0009 (the design system) — not new decisions. Resolved in a `grill-with-docs` run.

- **Tables are GFM markdown, never hand-rolled JSX.** `remark-gfm` is wired into `createMDX`, so `| … |` tables parse and flow through the styled `Table`/`Th`/`Td` components mapped in `mdx-components.tsx`. Author tables as markdown — don't assemble `<Table><Tr><Td>` by hand. Enrich *inside* cells (inline `code` for images/ports, links for cross-references); the wrapper owns the rounded, bordered, horizontally-scrollable chrome.
- **Code fences carry a language tag.** Shiki (`@shikijs/rehype`, build-time) highlights every fenced block, so write ```` ```yaml ````/```` ```ts ````/```` ```bash ````, never a bare ```` ``` ````, or the block ships uncoloured. `CodeBlock` stays the chrome (carbon background, border, copy button); Shiki owns only the token colours. One dark theme — the code surface is always carbon.
- **No literal backticks in component data.** Strings in `lib/*.ts` and `components/**` data (card `blurb`s, titles) render *verbatim* — a backtick in the string shows as a backtick on screen. Use a real `<code>` element in JSX, or plain prose. Backtick-as-markdown only works inside `.mdx` body text.
- **One page skeleton: `PageHeader` → lead → body → `PageNav` → `<Sources>`.** Every content page opens with `<PageHeader eyebrow title={…} />` (the `ds-mark` highlighter on the key word), and the four concept pages use a `<Hook>` component for the one-line "why you'll hit this" motif instead of a markdown `>` blockquote. Cross-page navigation uses the shared `<PageNav>` (prev/next cards), not inline hand-written `<a>` blocks. The collapsed `<Sources>` block always comes last.