# Docs site reorganized into three technology pillars plus a `Build` hub

The docs site (`apps/docs/`, [ADR-0007](./0007-docs-site-as-study-artifact.md)) is restructured from five flat top-level tiers (`Learn`, `Concepts`, `Architecture`, `Journey`, `Go`) into **three technology pillars** — **Kafka**, **Go**, **Kotlin** — plus one cross-cutting **The Build** hub. Each pillar shares an identical internal shape: an **overview/landing**, an ordered **`path/`** track, and a standalone **`concepts/`** reference. `The Build` holds **Architecture** and **Journey** (plus relocated infra concepts).

This reorganizes the tiers introduced by [ADR-0011](./0011-learn-track-general-kafka.md) (`Learn`) and [ADR-0020](./0020-go-language-track-and-per-technology-accent.md) (`Go`); it **preserves their principles** and supersedes only their flat-tier *placement*.

## Context

The five-tier nav grew one tier at a time and mixed three organizing axes at once: *subject* (`Learn` and `Concepts` are silently Kafka-only; `Go` is a language), *content shape* (a linear track vs a reference catalogue), and *the build* (`Architecture`, `Journey`). That was coherent with two technologies. It breaks at three: when Kotlin's `analytics` ships, a language has no natural home — it can't be a second `Go`, and it doesn't belong inside a Kafka-flavoured `Concepts`. `Learn` and `Concepts` are named as if universal but are Kafka-scoped, so `Go` sits awkwardly as a sibling of a content-type.

The stated learning goal is three technologies — Kafka, Go, Kotlin — each acquired through *guided lessons* and *reference concepts*. The nav should make that the reader's first choice.

The load-bearing constraint the restructure must not break: ADR-0011 separated general-Kafka (`Learn`, **build-state-independent**) from Pulse-specific concepts (`Concepts`, **build-state-gated** — a lit card means "Pulse runs this"), and explicitly *rejected* folding fundamentals into `/concepts` to keep that signal trustworthy.

## Considered options

- **Content-type-first (keep `Learn` / `Concepts` as the top axis).** Rejected: it leaves a new language homeless and forces each language to wedge into Kafka-shaped tiers — the exact failure that prompted this.
- **Pure subject-first (everything under a technology pillar).** Rejected: `Architecture` and `Journey` are about *the whole Pulse build*, not one technology; forcing them under a pillar misfiles them and would duplicate cross-cutting infra across pillars.
- **Subject pillars + a `Build` hub (chosen).** Three technology pillars carry per-technology learning; one hub carries the cross-cutting, build-state-gated system view. The reader's first choice is "which technology," with "the system that ties them together" as the fourth entry.
- **First pillar named `Distributed Systems` (Kafka as its centre).** Considered — it gives the architecture patterns (outbox, server-authored-events) an honest discipline-level home and matches the "improve as a software architect" goal. Rejected in favour of **`Kafka`**: punchier and more concrete for a reader landing cold, and the pillar holds patterns as Kafka-adjacent material without a hard fence (the label is a centre of gravity, not a boundary).
- **Persistent left sidebar for in-pillar navigation.** Rejected: a large surface-area change that fights the existing page skeleton (`PageHeader → lead → body → PageNav → Sources`, ADR-0010) and the established no-sidebar, hub-driven aesthetic. Three pillars is few enough that a top-nav switch suffices.

## Decision

**1. Four top-level entries:** `Kafka · Go · Kotlin · The Build`.

**2. Every pillar shares one shape**, and that shape *is* the build-state distinction re-expressed per technology:

| Pillar half | Replaces | Build-state semantics |
| --- | --- | --- |
| **overview / landing** | `LearnPath` / `go-path` hub | the pillar's map (path + concepts shelf) |
| **`path/`** (ordered lessons) | `Learn` (ADR-0011), `Go` track (ADR-0020) | **independent** — teaches the technology from zero |
| **`concepts/`** (standalone reference) | `Concepts` | **gated** — a lit card means "Pulse runs this" |

The `path/` ↔ `concepts/` split preserves the ADR-0011 signal: the catalogue stays a distinct surface with its lit/`coming` integrity; the pillar landing merely *shows both halves together* rather than scattering them across the nav. General fundamentals live in `path/` (build-state-independent), never inflating a `concepts/` card.

**3. `The Build` hub** collapses the former `Architecture` and `Journey` top-level tiers into one entry. It holds the cross-cutting, build-state-gated system view — system topology, per-service deep-dives, the chronological epic recaps — plus infra concepts that belong to the running system rather than a technology (`healthchecks`, `named-volumes` move here from `/concepts`).

**4. Concept reassignment.** Pure-Kafka concepts (the log, partitions, consumer groups, KRaft, topic provisioning, schema compatibility) and the Kafka-adjacent patterns (transactional outbox, server-authored events) → `kafka/concepts/`. `websocket-fanout` → `go/concepts/` (a Go networking pattern). `healthchecks`, `named-volumes` → `The Build`.

**5. Navigation mechanics.** No persistent sidebar. A pillar's landing page is its map; cross-page movement uses the shared `<PageNav>`. Ordered `path/` lessons additionally get a **sticky path-progress rail** ("you are here" in the sequence), scoped to `path/` pages only — `concepts/` and `Build` pages keep plain `<PageNav>`, since they are not a sequence.

## Consequences

- **ADR-0011 and ADR-0020 principles survive; their placement changes.** The build-state-independent track (`Learn`/`Go`) and the per-technology accent (ADR-0020 §2) are both retained — the track becomes each pillar's `path/`, the accent rule extends to the third pillar. Only the flat top-level tier list is superseded.
- **The per-technology accent gains its third, bounded member.** Kotlin's pillar takes Kotlin/JetBrains purple (`#7F52FF`, converted to oklch per ADR-0009 §1, with the `.ds-mark-kotlin` token set), under ADR-0020's rule: a *named technology with its own brand colour*, not decoration. Kafka yellow and Go cyan are unchanged. The build-state colour (`accent-green` for `live`) stays orthogonal.
- **Kotlin ships mostly `coming`.** Its overview and a stub `path/` exist; `concepts/` is dark until `analytics` ships, honoured by the existing build-state rule (planned, not broken). The pillar makes the depth asymmetry — Kafka deep, Go medium, Kotlin empty — honest and visible.
- **Routes move; old URLs redirect.** `/learn/* → /kafka/path/*`, `/concepts/<kafka> → /kafka/concepts/*`, `/go/* → /go/path/*`, `/architecture/* → /build/architecture/*`, `/journey/* → /build/journey/*`, `/concepts/websocket-fanout → /go/concepts/websocket-fanout`, infra concepts → `/build/architecture/*`. A personal learning site, so redirect cost is low, but bookmarks and `<Sources>`/`<PageNav>` internal links must be updated in the same pass.
- **The hub-as-map pattern generalizes from two to three.** `LearnPath` and `go-path` become instances of one pillar-overview component; the symmetry is now structural, not coincidental.
- **`The Build` answers the ADR-0007 "fourth content tier" question by merging, not proliferating.** Architecture + Journey were always the same *kind* of thing (the system and its history); naming the hub records that they cohere.

## Revisit triggers

- **A pillar's `concepts/` stays empty for more than one epic after its service ships** — reconsider whether that technology earned a full pillar or should be a track-only section.
- **A fourth technology appears.** Re-read the accent rule (ADR-0020 §2) and confirm the pillar shape still holds, or whether the nav needs grouping.
- **The sticky path-progress rail starts wanting to appear on `concepts/`** — a sign those pages are drifting from reference into an ordered track (the linearity trigger ADR-0011/0020 already set).
- **`The Build` accumulates a third sub-area** beyond Architecture and Journey — re-check that the hub is still cohesive and not a junk drawer for "everything not a pillar."
