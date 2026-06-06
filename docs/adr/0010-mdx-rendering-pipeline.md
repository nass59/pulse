# Build-time MDX rendering: remark-gfm + Shiki

The docs site (`apps/docs/`) renders content through `@next/mdx`. It shipped with `createMDX({})` — an empty pipeline. That had two silent consequences: GitHub-flavoured markdown tables (`| … |`) never parsed into `<table>` elements (the styled `Table`/`Th`/`Td` components in `mdx-components.tsx` were wired up but never reached), and fenced code blocks rendered as flat, unhighlighted text. This ADR records the decision to add two build-time remark/rehype plugins, and why build-time is the right call given the site is a fully static export (see [ADR-0007](./0007-docs-site-as-study-artifact.md) for why the site exists, [ADR-0009](./0009-devlab-design-system.md) for the design language the code chrome belongs to).

## 1. `remark-gfm` is the floor, not an enhancement

The `Table` component's own doc-comment says it maps "onto the raw markdown table elements … so every `| … |` table renders styled with no per-page work." That contract is only true with GFM in the pipeline.

**Decision:** add `remark-gfm` to `createMDX`. Markdown tables (plus strikethrough, autolinks, task lists) now parse, and every table flows through the existing styled `Table` wrapper. Tables stay authored as markdown — readable to write and to diff — rather than hand-assembled as JSX `<Table>` components.

- **Rejected — hand-author each table as JSX `<Table><Tr><Td>`.** Maximum per-table control, but every future table becomes hand-assembly, and it leaves the already-built `Table` component solving a problem nobody has. GFM markdown + the styled wrapper is the lower-friction system the components were designed for.

## 2. Syntax highlighting is build-time (Shiki), not runtime

The site is `output: "export"` — every page is static HTML. A runtime highlighter (Prism, highlight.js) would ship a tokeniser + grammar to the browser and re-highlight on the client, with a flash before hydration, for content that never changes after build.

**Decision:** highlight with **Shiki** via `@shikijs/rehype`, at build time. Shiki uses real TextMate grammars and VS Code themes, so the YAML/Kafka-config blocks that dominate these pages tokenise accurately. The HTML ships pre-coloured; zero highlighting JS reaches the browser.

- **Rejected — Prism / highlight.js at runtime.** Smaller grammars but ship client JS, flash on load, and tokenise less accurately than TextMate grammars — all cost for no benefit on a static site.
- **Rejected — `rehype-pretty-code`.** A capable Shiki wrapper (line numbers, highlighted ranges), but adds API surface this content doesn't yet need; `@shikijs/rehype` is the smaller primitive to start from.

**One dark theme only.** The code surface is always carbon (`CodeBlock` is dark on both light and dark site themes — ADR-0009), so a single dark Shiki theme is loaded rather than a light/dark pair.

## 3. `CodeBlock` is chrome; Shiki owns the tokens

Shiki emits its own `<pre><code>` with inline token colours and a background. The existing `CodeBlock` client component (mapped onto MDX `pre`) owns the border, carbon background, and copy button.

**Decision:** keep `CodeBlock` as the **chrome wrapper** and let Shiki own only the **token colours inside**. `CodeBlock` neutralises Shiki's own background (the carbon surface is the design system's, not the theme's) and keeps reading `textContent` for the copy button, which is agnostic to whether children are highlighted spans or plain text.

- **Rejected — let Shiki render the whole block.** Loses the copy affordance and the consistent carbon chrome that's part of the DevLab identity.

## Consequences

- `next.config.ts` moves from `createMDX({})` to a configured pipeline (`remark-gfm`, `@shikijs/rehype`). These run at build/`next build` time; the static export is unaffected at runtime.
- Card/list data must stop carrying literal backtick strings (e.g. a `blurb` of ``"survives `docker compose down`"``). Those render verbatim as text; a real `<code>` element or plain prose is the fix. This is now a docs convention (`AGENTS.md`).
- New authoring conventions are downstream of this decision, not new decisions themselves: tables = GFM markdown, code = fenced blocks with a language tag so Shiki can pick a grammar. Recorded in `apps/docs/AGENTS.md`.
