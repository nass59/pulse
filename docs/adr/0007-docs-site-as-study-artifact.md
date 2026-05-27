# Docs site (`apps/docs/`) as a derived study artifact

Pulse gets a Next.js documentation site at **`apps/docs/`**, generated and updated by an agent at epic boundaries, that explains the system in a more tutorial-shaped form than raw ADRs and `CONTEXT.md`. The site is a **derived study artifact**, not a source of truth: `docs/adr/` and `CONTEXT.md` remain canonical, and the site is downstream of them. A new top-level **`apps/`** directory is introduced for deployable applications that are not bounded contexts of the Pulse product; `services/` keeps its ADR-0002 meaning unchanged.

## Considered options

- **Pure renderer of `docs/`.** Rejected: the stated goal is "easier and funnier to absorb than reading md files." A renderer only re-displays the same content with prettier typography; it cannot add concept-first navigation, interactive components for dynamics-shaped concepts (partitioning, rebalance, outbox flow), or system-design diagrams. Different problem from the one we're solving.
- **Parallel authoring surface where new ADRs are written directly in the site.** Rejected: replaces markdown SoT, breaks the CLAUDE.md routing of future agents to `CONTEXT.md` and `docs/adr/`, and dissolves the "ADR is the trail of *why*" discipline this repo is built around. The site would silently become canonical; markdown would rot. Maintenance burden of "always canonical, always current" is much higher than "study artifact, 80% accurate, still teaches."
- **Put the site under `services/docs/`.** Rejected: `services/` is defined in ADR-0002 and `CONTEXT.md` as **bounded contexts of the Pulse product**. A docs site is *about* Pulse, not *part of* Pulse — it produces no events, consumes no topics, has no place on the system-topology diagram. Putting it in `services/` would muddy the domain boundary on day one and force "well, this one isn't really a service" caveats everywhere.
- **Put the site under `docs/site/`.** Rejected: `docs/` currently means "markdown SoT and agent docs." Mixing a Next.js build artifact into the same directory conflates content authoring with a deployable app, and creates confusing path semantics (`docs/adr/*.md` as sources vs `docs/site/` as the renderer of those sources, plus its own pages).
- **Separate repo.** Rejected: atomic updates across "Pulse the system" and "Pulse the docs" are valuable in a learning repo where one PR can simultaneously land an ADR, an issue closure, and the corresponding concept page. Loses the single-source-of-state-of-the-project affordance.
- **Pure TSX pages (no MDX).** Rejected: the agent's input form is markdown (ADRs, issues, `CONTEXT.md`); MDX keeps the translation surface minimal and lets a human re-read the source as nearly-prose months later. TSX-only would force re-encoding prose into JSX with no pedagogical gain and significant token overhead on every update.
- **Docusaurus.** Rejected: solves problems Pulse doesn't have (versioned docs, i18n, opinionated sidebars) and constrains the React composition the interactive components need. Next.js + MDX is closer to bare React, with first-class shadcn / Motion / `@xyflow/react` integration and a static-export path with no hosting requirements.
- **Automated update on each closed issue (git hook or watcher).** Rejected: premature automation for a learning project. Hook-driven LLM calls are noisy and costly, and they skip the review step that's part of how the maintainer learns. The right cadence is **manual, batched per epic**.
- **Update per-issue manually instead of per-epic.** Rejected as default cadence: per-issue updates produce small, fragmented diffs that miss patterns across an epic (e.g. foundations is really *one* connected lesson about the substrate, not three disjoint ones). Per-issue stays available as a mid-epic escape hatch when a single concept warrants immediate capture.

## Consequences

- A new top-level **`apps/`** directory enters the repo. `services/` keeps its bounded-context meaning intact. `apps/web/` — the `frontend-mvp` UI in Phase 1 — will be the natural peer and lands here too.
- **Stack:** Next.js (app router, static export), MDX, shadcn/ui + Tailwind v4, Motion for animation, `@xyflow/react` (React Flow) for interactive topology diagrams, Bun as runtime and package manager (per ADR-0006), React 19, TypeScript.
- **Source-of-truth relationship:** ADRs and `CONTEXT.md` are canonical. When the site disagrees with an ADR, the ADR wins and the site is wrong. CLAUDE.md continues to route future agents to `CONTEXT.md` and `docs/adr/`, not the site.
- **Content spine — three tiers, in priority order:**
  - **Concepts** (primary) — KRaft, healthchecks, partitioning, outbox, schema compatibility, compacted topics, rebalance, stream-table joins, ...
  - **Architecture** — system topology, per-service deep-dives, chat topology table as an interactive widget.
  - **Journey** — phase/epic progress; auto-updates as issues close.
- **Cross-linking:** every concept page carries `sources:` frontmatter listing the ADR(s) and issue(s) it derives from. Architecture pages list "concepts in play here." Journey pages list "lessons unlocked in this phase."
- **Interactive-widget discipline — the dynamics-shaped filter.** A concept earns an interactive component only if it is (a) a flow over time, (b) a parameter space with a visible effect, or (c) a topology worth exploring. Declarative concepts get prose and static diagrams. Animation must earn its bytes. Without this rule, the project bloats into infinite Motion practice.
- **Update cadence:** epic-close manual catch-up is the default — the maintainer asks "bring the docs up to date" once an epic's issues are all `done`. Mid-epic single-issue updates are an escape hatch. No automation hooks.
- **Site staleness is bounded by epic cadence**, not issue cadence. Acceptable trade-off in exchange for coherent per-epic update batches.
- **The site is not the entry point for agents working on Pulse code.** CLAUDE.md and `CONTEXT.md` remain the authoritative front door for that purpose. The site is for humans (currently: one human, the maintainer) to *read*.
- **Building the site is outside the Kafka/distributed-systems curriculum.** The discipline is to treat it as a study-aid project, agent-authored, and resist letting it expand into a UI side-project that displaces the actual Pulse learning.

## Revisit triggers

- **Scoped Turborepo for the JS side.** Adding `apps/docs/` (and soon `apps/web/`) plus `services/identity/` means the JS workspace spans three packages. This is the trigger condition called out in ADR-0005 — defer until `apps/docs/` is real and the JS-side build/test/dev tasks start to feel disjointed, then evaluate.
- **Cadence drop to per-phase.** If per-epic updates consistently produce low-value diffs, drop the cadence to per-phase (Phase 0 → 1 → 2 …).
- **Stale-section marker.** If the site lags markdown enough that it actively misleads, either tighten cadence or formally mark sections as "covers up to Phase N."
- **Fourth content tier.** If a Pulse concept can't fit Concepts or Architecture cleanly, reconsider — but only after at least two concrete examples exist. Resist tier proliferation in the meantime.
