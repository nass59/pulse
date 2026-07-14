# A `Distributed Systems` pillar carries book-driven architecture tracks

The docs site gains a **fourth top-level pillar: `Distributed Systems`**, alongside `Kafka · Go · Kotlin` and `The Build` ([ADR-0021](./0021-docs-site-technology-pillars.md)). It is **book-driven**: each architecture book the maintainer reads (starting with *Software Architecture: The Hard Parts*) becomes an ordered chapter track that retells the book's trade-offs through Pulse's real decisions. This supersedes ADR-0021's four-entry nav and amends the accent rule of [ADR-0020](./0020-go-language-track-and-per-technology-accent.md) §2.

## Context

The learning goal was always two-headed: Kafka *and* "improve as a software architect." The pillars serve the first head; the second had no home. ADR-0021 felt this — it considered naming the first pillar `Distributed Systems` because that "gives the architecture patterns an honest discipline-level home and matches the 'improve as a software architect' goal," then rejected the name *for the Kafka pillar* as too abstract for a cold reader.

The maintainer now studies architecture through books (*The Hard Parts* first, at least two more planned), producing per-chapter notes that deserve to become Pulse-grounded pages: diagrams, analogies, cross-links to the ADRs that already record the decisions each chapter theorizes about.

Two ADR-0021 revisit triggers fired at once: "`The Build` accumulates a third sub-area" (if the track went there) and "a fourth technology appears" (if it became a pillar).

## Considered options

- **A third sub-area of `The Build` (`/build/hard-parts/`).** Cohesive for one book — The Build is "the system and its history," and trade-off analysis of that system fits. Rejected because the shelf is three books and growing: a curriculum, not a sub-area. The Build stays two-area and cohesive.
- **A fourth pillar (chosen).** Honest about the discipline-level ambition. Bends the pillar contract in two places — a discipline is not a technology, and three books cannot share one `path/` — so both bends are decided explicitly below.
- **Pillar named `Architecture`.** Rejected: collides with `The Build → Architecture` (`/build/architecture`), exactly the nav ambiguity ADR-0021 exists to prevent. `Distributed Systems` also matches the shelf (*The Hard Parts*' subtitle is "Modern Trade-Off Analyses for Distributed **Architectures**").

## Decision

**1. Five top-level entries:** `Kafka · Go · Kotlin · Distributed Systems · The Build`. The name ADR-0021 set aside finds its rightful owner: the pillar *is* the discipline; `The Build → Architecture` remains the concrete Pulse system the discipline points at.

**2. Shelf of tracks, not one `path/`.** The pillar generalizes ADR-0021's "one ordered `path/`" to **one ordered track per book**:

```
/distributed-systems                      ← landing: book shelf + concepts shelf
/distributed-systems/hard-parts/<chapter> ← ordered track, sticky path-progress rail
/distributed-systems/<next-book>/<chapter>
/distributed-systems/concepts/<pattern>   ← gated reference, lit = "Pulse runs this"
```

Books are read sequentially and independently; a merged mega-path would force a false ordering between them. Unread/future books show as `coming` — the ADR-0011 honesty mechanic, applied to a shelf.

**3. One-home rule for concepts.** A concept card lives in exactly one pillar: **the most concrete pillar that implements it**. Transactional outbox and server-authored events *stay* in `kafka/concepts/` (ADR-0021 §4 stands). `distributed-systems/concepts/` earns a card only for patterns that are genuinely technology-homeless in Pulse — spanning services with no single implementing technology (a cross-service saga, when one exists). The shelf therefore **starts empty**, honestly, like Kotlin's did. Chapter pages cross-link to cards in other pillars; the link is the lesson.

**4. Accent: O'Reilly red.** ADR-0020 §2's letter ("a *named technology* with its own *brand colour*") cannot cover a discipline; its spirit — *an accent must trace to a real-world anchor, never arbitrary decoration* — can, and is now the rule. This pillar anchors to O'Reilly red (converted to oklch per ADR-0009), pointing at where the pillar's content literally comes from, as Go cyan points at golang.org. Kafka yellow, Go cyan, Kotlin purple, and the orthogonal build-state green are unchanged.

**5. Chapter pages are translations, not summaries.** Every chapter page follows one arc: analogy-first hook → the trade-off distilled in Pulse's vocabulary → where Pulse stands (diagram + ADR links) → the road not taken (the losing alternative, drawn concretely in Pulse) → what would change our mind (revisit triggers) → sources. The **anti-summary test**: every section must name something real — a Pulse topic, service, file, or ADR. A section that could appear unchanged in someone else's notes on the book gets rewritten or cut. A chapter that exposes an undocumented Pulse decision triggers a new ADR, not a longer page.

## Consequences

- **ADR-0021's principles survive; its nav count changes.** Pillar shape (landing / ordered track / gated concepts), the path-progress rail, build-state gating, and hub-as-map all extend unchanged to the fifth entry. Only "three technology pillars plus a Build hub" is superseded — it is now four pillars plus the hub, and "pillar" no longer implies "technology."
- **ADR-0020 §2 is amended, not broken.** The accent rule's anchor requirement generalizes from technology brands to real-world anchors; every existing accent already satisfies the new wording.
- **The book pages create link-debt on purpose.** They point at ADRs and concept cards rather than restating them, so renaming or superseding an ADR now has one more consumer to update.
- **The pillar ships mostly `coming`** — one book in progress, two placeholders. Same visible-asymmetry honesty as Kotlin's launch.

## Revisit triggers

- **A second documentation surface smell:** a chapter page grows a section that restates an ADR instead of linking it — re-read Decision §5 and cut.
- **`distributed-systems/concepts/` still empty after the sagas/data-ownership chapters ship** and Pulse has a real cross-service pattern — either the one-home rule is filing it under a technology wrongly, or the pattern was never built; find out which.
- **A non-O'Reilly book joins the shelf** — the red anchor weakens to "the classic tech-book red"; decide whether the anchor story still holds or the accent needs re-grounding.
- **A book track stalls for more than one epic** — the shelf's `coming` honesty only works if `coming` eventually lights; consider hiding stalled placeholders instead.
