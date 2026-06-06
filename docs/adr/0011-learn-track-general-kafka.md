# A `Learn` track for general Kafka pedagogy, separate from build-state-gated concepts

The docs site (`apps/docs/`, ADR-0007) gains a fourth top-level tier, **`Learn`** (`/learn`), holding a short, linear "Kafka from zero" track: *what Kafka is*, *why it exists*, *how it works* (the log, partitions, consumer groups, offsets), and *how to get started*. It targets a senior engineer with **no Kafka background** and teaches Kafka **the technology**, generically — decoupled from what Pulse has built so far.

This deliberately trips the "Fourth content tier" revisit trigger in ADR-0007, which says to *resist* tier proliferation and only reconsider once a Pulse concept can't fit Concepts or Architecture. This ADR records why the guard is satisfied here anyway.

## Context

ADR-0007 establishes the site as a **derived study artifact**: every page translates a decision already recorded in `docs/adr/` or `CONTEXT.md`, and the build-state-honesty rule (`apps/docs/AGENTS.md`) forbids depicting infrastructure Pulse doesn't run. The three tiers — **Concepts**, **Architecture**, **Journey** — are all *build-state-gated*: a concept page ships only once Pulse has exercised the idea, which is why partitions, consumer groups, and offsets currently sit in `COMING_CONCEPTS`, unlit, awaiting the services that drive them.

That gate is correct for Pulse-specific claims and wrong for a newcomer. A senior engineer who has never used Kafka cannot read the KRaft concept page — it assumes they already know what a broker, a topic, and the log *are*. The fundamentals that would unblock them are exactly the ones the build-state gate keeps dark. The honest, derived-artifact framing has no natural home for "here is how Kafka works, in general," because that content makes no claim about Pulse's running system at all.

## Considered options

- **Fold fundamentals into `/concepts`.** Rejected: it breaks the one property that makes `/concepts` trustworthy. The catalogue's value is that a lit card means "Pulse runs this." Teaching partitions there — before any Pulse service partitions anything — either lights a card dishonestly or forces a second, contradictory meaning onto "lit." Two meanings for one signal is worse than a new tier.
- **Teach fundamentals inline on each concept page.** Rejected: every concept page would re-explain the log, topics, and offsets from scratch, or none would and they'd stay unreadable to a newcomer. Neither scales; the fundamentals want one canonical, linear home.
- **Link out to hellointerview / the Apache intro and don't write it.** Rejected: the site's whole reason to exist (ADR-0007) is that a derived, diagram-first read teaches better than raw source. The same logic that justifies the site over "just read the ADRs" justifies a first-class fundamentals track over "just read someone else's tutorial." It also keeps the teaching in the project's own voice and design language.
- **A new `Learn` tier, build-state-*independent* by construction (chosen).** `Learn` is not a fourth bucket of Pulse concepts — it is a different *category*. It teaches Kafka-the-technology, so there is no Pulse build-state to be honest or dishonest about. The fourth-tier guard in ADR-0007 was written to stop *Pulse-concept* proliferation; it does not bind a category that sits outside the build-state model entirely.

## Decision

Add `/learn` as a fourth tier with four pages: a track index, **What is Kafka** (why it exists), **How it works** (the mechanism), and **Getting started** (hands-on). It is the recommended entry point for a reader new to Kafka and is placed first in the header nav.

## Consequences

- **The build-state-honesty rule still holds — by a different mechanism.** `Learn` diagrams depict the *universal* Kafka mechanism, never Pulse's topology, and say so. This is the existing "illustrative, labelled" precedent the homepage `Firehose` already set: it animates load Pulse is built to absorb, not a running system, and is labelled as such. `Learn` widgets carry the same framing. Pulse-specific build-state claims stay in Concepts / Architecture / Journey, unchanged.
- **One page is grounded in real build state anyway.** *Getting started* uses the actual Phase 0 commands — `docker compose up`, the `kcat` produce/consume round-trip — that genuinely happened (`foundations/02`, `foundations/03`). It is build-state-honest in the original sense, and it is the bridge from the general track into the Pulse-specific tiers.
- **The interactive-widget filter (ADR-0007) is unchanged and still binding.** `Learn` earns interactive widgets only for genuinely dynamics-shaped ideas — the append-only log with independent offsets, key→partition routing under a changing partition count, and consumer-group rebalance. Everything else ships as static diagrams and prose. Each interactive widget gets a Storybook story (ADR-0008).
- **Provenance points outward, not to an ADR.** Unlike the derived tiers, `Learn` pages translate no internal decision — they teach a public technology. Their `<Sources>` block cites the canonical external references (Apache Kafka docs, AWS, hellointerview) instead of ADRs, with the Pulse-specific *Getting started* page also citing the `foundations/*` issues it mirrors.
- **Scope discipline carries over.** Per ADR-0007, building the site is outside the Kafka curriculum; `Learn` is a teaching aid authored at epic boundaries, not a tutorial product to grow without bound. It covers fundamentals once, well, and stops.

## Revisit triggers

- **Fundamentals start duplicating a now-lit concept page.** Once Pulse ships services that exercise partitions / consumer groups and those concept pages light up, re-check that `Learn` and `/concepts` divide cleanly (general mechanism vs. Pulse's specific use) rather than restating each other.
- **The track stops being linear.** If `Learn` grows branches or reference-style depth, reconsider whether it is still a "from zero" track or has drifted into a second Concepts catalogue.
