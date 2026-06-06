---
name: docs-page
description: Create or improve a page on the Pulse docs site (apps/docs), following its established conventions. Use when the user wants to add, write, draft, or improve a docs page — a Learn page, concept page, architecture page, or journey recap — or runs /docs-page.
---

# docs-page

Orchestrates authoring a page on the Pulse documentation site (`apps/docs`). This
is a **workflow, not a rulebook**: the conventions already live in
`apps/docs/AGENTS.md` and `docs/adr/`, and the best templates are the real pages
already in the repo. This skill owns the _procedure_ — the decision gates, the
drafting order, and the verification loop — and defers every rule to the canon
below. If this skill and `AGENTS.md` ever disagree, `AGENTS.md` wins.

## Modes — inferred from the argument

- **improve** — the argument names an existing page (a path like
  `app/concepts/kraft-mode/page.mdx` or a route like `/concepts/kraft-mode`).
- **create** — the argument is a topic ("a page on consumer lag").
- **ambiguous** — ask which, with a recommendation, before doing anything.

## Read the canon first (don't restate it — point at it)

| Need                                                                                                          | Where it lives                                                                |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Content conventions (provenance, build-state honesty, dynamics filter, voice, page skeleton, rendering rules) | `apps/docs/AGENTS.md`                                                         |
| Why the site exists + the dynamics-shaped filter                                                              | `docs/adr/0007-docs-site-as-study-artifact.md`                                |
| Storybook story required per interactive widget                                                               | `docs/adr/0008-storybook-for-component-isolation.md`                          |
| DevLab design tokens & component grammar                                                                      | `docs/adr/0009-devlab-design-system.md`, `apps/docs/app/globals.css`          |
| MDX rendering pipeline (GFM tables, Shiki fences)                                                             | `docs/adr/0010-mdx-rendering-pipeline.md`                                     |
| The Learn tier as general (un-gated) pedagogy                                                                 | `docs/adr/0011-learn-track-general-kafka.md`                                  |
| Global MDX components (available in any `.mdx` without import)                                                | `apps/docs/mdx-components.tsx`                                                |
| Page primitives                                                                                               | `apps/docs/components/docs/`                                                  |
| Interactive widgets / static figures                                                                          | `apps/docs/components/interactive/`, `apps/docs/components/learn/figures.tsx` |
| Data libs (catalogue, roadmap, learn path)                                                                    | `apps/docs/lib/{concepts,roadmap,learn}.ts`                                   |
| ADR link registry (add new ADRs here)                                                                         | `apps/docs/components/docs/sources.tsx` (`ADR_INDEX`)                         |

## The four tiers — pick one (Gate A)

| Tier             | Route           | Provenance                | Build-state gated?                                                                          | Canonical example                  |
| ---------------- | --------------- | ------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Learn**        | `/learn`        | external `<Sources refs>` | **No** — teaches the technology generically                                                 | `app/learn/what-is-kafka/page.mdx` |
| **Concepts**     | `/concepts`     | `<Sources adrs issues>`   | **Yes** — only ships once Pulse exercises the idea; `live` vs `coming` in `lib/concepts.ts` | `app/concepts/kraft-mode/page.mdx` |
| **Architecture** | `/architecture` | `<Sources adrs issues>`   | **Yes** — topology must be build-state honest                                               | `app/architecture/page.mdx`        |
| **Journey**      | `/journey`      | `<Sources adrs issues>`   | **Yes** — per-phase recap of what shipped                                                   | `app/journey/foundations/page.mdx` |

## Workflow

### 1. Orient

Read `apps/docs/AGENTS.md` and the canonical example for the likely tier. In
**improve** mode, also read the target page and diff it against the conventions
(skeleton present? `<Hook>` on a concept page? collapsed `<Sources>` last? GFM
tables, language-tagged fences? voice? build-state honesty?). Surface the gaps
before changing anything.

### 2. Gate A — which tier (confirm with a recommendation)

Propose the tier with reasoning and invite pushback; don't present a blank menu.
The tier sets the provenance model, whether build-state gating applies, and the
voice. Getting it wrong costs a rewrite, so confirm before drafting.

### 3. Gate B — does it earn an interactive widget (confirm with a recommendation)

Apply the **dynamics-shaped filter** (ADR-0007): a concept earns an interactive
widget only if it is (a) a flow over time, (b) a parameter space with a visible
effect, or (c) a topology worth exploring. Otherwise it ships as a **static
figure** (server component) or prose. Propose static-vs-interactive with
reasoning. If interactive, it **must** get a Storybook story (ADR-0008).

### 4. Hard gate — build-state honesty (enforce, don't ask)

Before drafting, check the plan against what Pulse has actually built:

- **Concepts / Architecture / Journey** — never draw an un-built node/edge as
  live; never link or light a concept page before it ships; don't invent
  architecture not in `CONTEXT.md` / `docs/adr/`.
- **Learn** — depict the _universal_ Kafka mechanism, never Pulse's topology, and
  label illustrative widgets as such (the `Firehose` precedent).
- If a genuine new convention or architectural decision **crystallises while
  drafting**, STOP. Route to `grill-with-docs` / write the ADR first (and
  register it in `sources.tsx` `ADR_INDEX`), then resume. The docs follow the
  decision; they don't make it.

### 5. Draft

- **Skeleton (every page):** `<PageHeader eyebrow title={…with a ds-mark word} />`
  → lead paragraph → body → `<PageNav prev next />` → collapsed `<Sources>` last.
  Concept pages open with a one-line `<Hook>` instead of a blockquote.
- **Voice:** write like a friend explaining it — lead with a concrete analogy or
  scenario, short paragraphs, one good diagram over three paragraphs. Precision is
  non-negotiable; friendly never means hand-wavy. No "ADR-000X" in the prose flow.
- **Rendering:** GFM markdown tables (never hand-rolled `<Table>`); code fences
  carry a language tag (` ```yaml `, ` ```ts `); no literal backticks
  in `lib/*.ts` or component data (use a real `<code>` element).
- **New interactive widget** → `components/interactive/`, `"use client"`, honour
  `useReducedMotion`, gate animation on an `IntersectionObserver` when it
  autoplays, and keep **initial render deterministic** — no `Math.random()` or
  mutable module counters in seed state, or SSR/hydration will mismatch (the
  `LogTape` lesson). Ship a `.stories.tsx` beside it (hoist regex literals to
  top-level consts; add a `play` interaction test).
- **New static figure** → server component wrapped in `DiagramFrame`, no client
  boundary; reuse the a11y-safe tone pattern (category colour as text + hairline
  border, never a low-contrast fill).
- **Wiring:** page-specific big components are imported at the top of the `.mdx`;
  broadly-reused ones get registered in `mdx-components.tsx`. New section → add to
  `components/docs/header.tsx`. New concept → `lib/concepts.ts` (`live` only with
  an `href`). New Learn step → `lib/learn.ts`. Links inside `Callout`/`Hook` must
  be inline markdown (multi-line JSX `<a>` breaks to its own line; `.ds-rich a`
  styles them).

### 6. Provenance (`<Sources>` is always last, collapsed)

- **Learn** → `<Sources refs={[{label, href}, …]} />` (Apache / AWS / hellointerview).
- **Other tiers** → `<Sources adrs={[…]} issues={["foundations/02-…"]} />`. ADRs
  render as GitHub links (must exist in `ADR_INDEX`); `.scratch/` issues render as
  **plain labels, never links** — the tracker is local-only.

### 7. Verify (proportionate)

Always, from `apps/docs`:

1. `bun x ultracite fix <changed files>`
2. `bun run build` — typechecks and compiles the MDX (catches bad component usage)
3. For any touched widget: `bun x vitest run --project=storybook <story file>`

**Browser check — required only if the page added or changed an interactive
widget or a custom figure** (where hydration/layout bugs hide and the build can't
see them): start `bun run dev`, open the page, and confirm it hydrates with **no
console errors**, the widget responds to interaction, and figures render at both
mobile and desktop width. **Skip it** for prose / table / Callout-only edits —
the build covers those.

### 8. Report

Summarise: tier, static-vs-interactive call, files touched, provenance wired, and
the verification results (build, story tests, and the browser check if run).

## Boundaries

- Stay within `apps/docs/` (plus `docs/adr/` only if an ADR is genuinely needed).
- Never touch `.scratch/` — it's local-only; issues are labels, never links.
- Never mark a concept `live` or link its page before it ships.
- Never invent architecture; a crystallised decision is an ADR first, page second.
- Don't commit unless asked.
