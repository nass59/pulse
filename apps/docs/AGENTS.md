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