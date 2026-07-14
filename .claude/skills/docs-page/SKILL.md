---
name: docs-page
description: Create or improve a page on the Pulse docs site (apps/docs), following its established conventions. Use when the user wants to add, write, draft, or improve a docs page — a pillar path lesson, concept page, Build architecture page, or journey recap — or runs /docs-page. For book-chapter pages on the Distributed Systems pillar, the book-chapter skill drives and defers to this one for mechanics.
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
  `app/kafka/concepts/kraft-mode/page.mdx` or a route like `/kafka/concepts/kraft-mode`).
- **create** — the argument is a topic ("a page on consumer lag").
- **ambiguous** — ask which, with a recommendation, before doing anything.

## Read the canon first (don't restate it — point at it)

| Need                                                                                                          | Where it lives                                                                |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Content conventions (provenance, build-state honesty, dynamics filter, voice, page skeleton, rendering rules) | `apps/docs/AGENTS.md`                                                         |
| Pillar IA (overview + `path/` + `concepts/`, The Build hub)                                                    | `docs/adr/0021-docs-site-technology-pillars.md`                               |
| Distributed Systems pillar: book tracks, one-home rule, chapter-page arc                                       | `docs/adr/0025-distributed-systems-pillar-book-tracks.md`                     |
| Why the site exists + the dynamics-shaped filter                                                              | `docs/adr/0007-docs-site-as-study-artifact.md`                                |
| Storybook story required per interactive widget                                                               | `docs/adr/0008-storybook-for-component-isolation.md`                          |
| DevLab design tokens & component grammar                                                                      | `docs/adr/0009-devlab-design-system.md`, `apps/docs/app/globals.css`          |
| MDX rendering pipeline (GFM tables, Shiki fences)                                                             | `docs/adr/0010-mdx-rendering-pipeline.md`                                     |
| The `path/` half as general (un-gated) pedagogy                                                                 | `docs/adr/0011-learn-track-general-kafka.md`                                  |
| Global MDX components (available in any `.mdx` without import)                                                | `apps/docs/mdx-components.tsx`                                                |
| Page primitives                                                                                               | `apps/docs/components/docs/`                                                  |
| Interactive widgets / static figures                                                                          | `apps/docs/components/interactive/`, `apps/docs/components/kafka/figures.tsx` |
| Data libs (concept shelves, pillar specs + path rail, roadmap)                                                                    | `apps/docs/lib/{concepts,pillars,learn,go,roadmap}.ts`                                   |
| ADR link registry (add new ADRs here)                                                                         | `apps/docs/components/docs/sources.tsx` (`ADR_INDEX`)                         |

## The surfaces — pick one (Gate A)

Per ADR-0021, the nav is technology pillars (`/kafka`, `/go`, `/kotlin`) — each
shaped **overview + `path/` + `concepts/`** — plus the `/build` hub and the
book-driven `/distributed-systems` pillar (ADR-0025). A page lands on one of:

| Surface                    | Route                              | Provenance                       | Build-state gated?                                                                          | Canonical example                        |
| -------------------------- | ---------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Pillar `path/` lesson**  | `/<pillar>/path/<slug>`            | external `<Sources refs>`        | **No** — teaches the technology from zero                                                   | `app/kafka/path/what-is-kafka/page.mdx`  |
| **Pillar `concepts/` ref** | `/<pillar>/concepts/<slug>`        | `<Sources adrs issues>`          | **Yes** — a lit card means Pulse runs it; shelves are the per-pillar arrays in `lib/concepts.ts` | `app/kafka/concepts/kraft-mode/page.mdx` |
| **Build: Architecture**    | `/build/architecture/<slug>`       | `<Sources adrs issues>`          | **Yes** — topology must be build-state honest                                               | `app/build/architecture/page.mdx`        |
| **Build: Journey**         | `/build/journey/<slug>`            | `<Sources adrs issues>`          | **Yes** — per-epic recap of what shipped                                                    | `app/build/journey/foundations/page.mdx` |
| **Book chapter**           | `/distributed-systems/<book>/<ch>` | `<Sources refs adrs>` (book + ADRs) | Track ordered per book; content must pass the ADR-0025 anti-summary test                    | (first ships with *The Hard Parts*)      |

Book-chapter pages are **driven by the `book-chapter` skill** (intake → mapping
→ debate); this skill supplies only the drafting/verification mechanics below.
Concept placement follows the **one-home rule** (ADR-0025 §3): a card lives in
the most concrete pillar that implements it; cross-link, never duplicate.

## Workflow

### 1. Orient

Read `apps/docs/AGENTS.md` and the canonical example for the likely surface. In
**improve** mode, also read the target page and diff it against the conventions
(skeleton present? `<Hook>` on a concept page? collapsed `<Sources>` last? GFM
tables, language-tagged fences? voice? build-state honesty?). Surface the gaps
before changing anything.

### 2. Gate A — which surface (confirm with a recommendation)

Propose the surface with reasoning and invite pushback; don't present a blank
menu. The surface sets the provenance model, whether build-state gating applies,
and the voice. Getting it wrong costs a rewrite, so confirm before drafting.

### 3. Gate B — does it earn an interactive widget (confirm with a recommendation)

Apply the **dynamics-shaped filter** (ADR-0007): a concept earns an interactive
widget only if it is (a) a flow over time, (b) a parameter space with a visible
effect, or (c) a topology worth exploring. Otherwise it ships as a **static
figure** (server component) or prose. Propose static-vs-interactive with
reasoning. If interactive, it **must** get a Storybook story (ADR-0008).

### 4. Hard gate — build-state honesty (enforce, don't ask)

Before drafting, check the plan against what Pulse has actually built:

- **Gated surfaces (`concepts/`, `/build`, book chapters)** — never draw an
  un-built node/edge as live; never link or light a concept card before it
  ships; don't invent architecture not in `CONTEXT.md` / `docs/adr/`.
- **`path/` lessons** — depict the _universal_ mechanism of the technology,
  never Pulse's topology, and label illustrative widgets as such (the
  `Firehose` precedent).
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
  broadly-reused ones get registered in `mdx-components.tsx`. New nav section →
  `components/docs/header.tsx`. New concept → its pillar's array in
  `lib/concepts.ts` (`live` only with an `href`). New `path/` step → the pillar's
  data lib (`lib/learn.ts` for Kafka, `lib/go.ts` for Go) and `lib/pillars.ts`
  (`PILLAR_PATHS` drives the sticky `<PathRail>`). Links inside `Callout`/`Hook` must
  be inline markdown (multi-line JSX `<a>` breaks to its own line; `.ds-rich a`
  styles them).

### 6. Provenance (`<Sources>` is always last, collapsed)

- **`path/` lessons** → `<Sources refs={[{label, href}, …]} />` (Apache / AWS / hellointerview).
- **Book chapters** → `<Sources refs adrs />` — the book chapter as a ref plus the linked ADRs.
- **Other surfaces** → `<Sources adrs={[…]} issues={["foundations/02-…"]} />`. ADRs
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

Summarise: surface, static-vs-interactive call, files touched, provenance wired, and
the verification results (build, story tests, and the browser check if run).

## Boundaries

- Stay within `apps/docs/` (plus `docs/adr/` only if an ADR is genuinely needed).
- Never touch `.scratch/` — it's local-only; issues are labels, never links.
- Never mark a concept `live` or link its page before it ships.
- Never invent architecture; a crystallised decision is an ADR first, page second.
- Don't commit unless asked.
