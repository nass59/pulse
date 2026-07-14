---
name: book-chapter
description: Turn a chapter reading from an architecture book (summary + notes) into a Distributed Systems pillar page on the Pulse docs site, per ADR-0025. Use when the user shares chapter notes or a summary from "Software Architecture - The Hard Parts" (or another book on the shelf), says he read a chapter, or runs /book-chapter.
---

# book-chapter

Runs the ADR-0025 loop: chapter notes in → Pulse-grounded chapter page out.
This is a **workflow, not a rulebook** — the decisions live in
`docs/adr/0025-distributed-systems-pillar-book-tracks.md` (pillar shape,
one-home rule, page arc, anti-summary test) and page mechanics live in the
`docs-page` skill's canon (`apps/docs/AGENTS.md`). If this skill and either
of those disagree, they win.

The maintainer's role: he reads and takes the notes; you analyze, debate, and
draft; **he edits the draft**. Prose is drafted directly — this is the agreed
exception to tutor mode (only service code is typed by him).

## Workflow

### 1. Intake

Expect: book, chapter number + title, his summary, his notes. If any is
missing, ask — his notes steer the page's emphasis, don't draft without them.

Check the track exists (`apps/docs/app/distributed-systems/<book-slug>/`).
If the pillar or track isn't scaffolded yet, stop and flag it as a
prerequisite build task — decide together who types it (that part is UI code,
so tutor mode applies).

### 2. Map the chapter onto Pulse

Read the chapter notes against `CONTEXT.md`, `docs/adr/`, and the relevant
service code. Produce the mapping:

- Which Pulse decisions **embody** the chapter's trade-off, and which ADRs
  record them.
- Where Pulse **deliberately violates** the chapter's advice — those pages
  are the best ones; say so plainly.
- Where the chapter exposes a decision Pulse made but **never wrote down** —
  STOP: route to `grill-with-docs`, write the ADR first, then resume.
  The page follows the decision; it never makes it.

### 3. Debate the argument (gate — confirm before drafting)

Propose the page's argument and invite pushback, per the ADR-0025 §5 arc:

- **Hook** — which analogy world (soccer, F1, NBA, Twitch, movies, games…)
  and the one-sentence framing.
- **The mapping** from step 2 — which decisions anchor "where Pulse stands."
- **Diagrams** — what each one shows; static figure vs interactive per the
  `docs-page` dynamics filter.
- **The road not taken** — which losing alternative gets drawn, concretely,
  in Pulse.

Recommend with reasoning; the debate is the learning, don't skip to drafting.

### 4. Draft

Write the MDX at `apps/docs/app/distributed-systems/<book-slug>/<chapter-slug>/page.mdx`,
following the `docs-page` skill for skeleton, voice, rendering, wiring, and
provenance (`<Sources>` carries the book chapter as a ref **and** the linked
ADRs). Enforce while writing:

- **Anti-summary test** (ADR-0025 §5): every section names a real Pulse
  topic, service, file, or ADR. A section that could sit unchanged in a
  stranger's book notes gets rewritten or cut.
- **One-home rule** (ADR-0025 §3): link concept cards in their home pillar,
  never duplicate them. A new `distributed-systems/concepts/` card only for
  a pattern with no single implementing technology — and that's an ADR-0025
  trigger check, not a quiet add.
- Thin "road not taken" / "revisit" sections are fine for intro chapters;
  thin beats padded.

### 5. Verify and hand over

Run the `docs-page` verification loop (ultracite, `bun run build`, story
tests / browser check only if a widget was touched). Then hand over for his
edit pass: summarise the argument in two sentences, list the files touched,
and point at the sections where you made a judgment call he should re-read.

## Boundaries

- Never draft from the book alone — no notes, no page.
- Never restate an ADR's content on a page; link it.
- A crystallised decision is an ADR first, page second.
- Stay in `apps/docs/` + `docs/adr/`; don't commit unless asked.
