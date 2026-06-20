# A `/go` language track, and a per-technology accent (Go blue beside Kafka yellow)

The docs site (`apps/docs/`, [ADR-0007](./0007-docs-site-as-study-artifact.md)) gains a fifth top-level tier, **`Go`** (`/go`): a short, linear "Go for a TypeScript engineer" track — the shape of a Go service, goroutines and channels, and the cgo-backed Kafka client — taught generically but grounded in the real `chat` service the `chat-mvp` epic shipped. Alongside it, DevLab ([ADR-0009](./0009-devlab-design-system.md)) gains a **second, technology-scoped accent**: Go's brand cyan (`#00ADD8`) marks "this is a Go idea," the way electric-yellow has always marked "this is a Kafka idea."

This records two decisions that are genuine trade-offs and awkward to reverse once pages and components depend on them.

## 1. A `/go` tier, build-state-independent by construction

The `chat-mvp` epic was the project's first encounter with Go, and the learning was as much about *the language* as about Kafka — goroutine-per-connection fan-out, errors-as-values, the cgo build tax of `confluent-kafka-go`, Avro struct-tag casing. None of that is a Kafka concept, and none of it fits the existing tiers.

This trips the same "resist tier proliferation" guard ADR-0007 raised and [ADR-0011](./0011-learn-track-general-kafka.md) had to satisfy for `Learn`. The argument is the same shape, and it holds:

- **Fold Go into `/learn`.** Rejected. `Learn` is scoped by ADR-0011 to *Kafka the technology, from zero*. A language track is a different category; mixing Go pages into the Kafka-from-zero spine muddies the one thing that makes `/learn` coherent.
- **Fold Go into `/concepts`.** Rejected for the reason ADR-0011 already gave: a lit concept card means "Pulse runs this Kafka idea." Go-language pedagogy makes no Kafka build-state claim, so gating it there either lights cards dishonestly or overloads what "lit" means.
- **A new `Go` tier, build-state-independent (chosen).** Like `Learn`, `Go` teaches a technology, not Pulse's running system — there is no build-state to be honest or dishonest about. The fourth-tier guard exists to stop *Pulse-concept* proliferation; a language track sits outside the build-state model entirely, exactly as `Learn` does.

**Decision.** Add `/go` with a track index (plus the TS→Go mental-model bridge from the maintainer's `go-quickref`) and three lesson pages: **The shape of a service**, **Goroutines & channels**, and **The cgo Kafka client**. It is placed after `Journey` in the header nav. Each page closes with a recall quiz, in the same `ConceptQuiz` widget the concept pages use.

## 2. A per-technology accent: Go blue, not a third brand colour

ADR-0009 §1 made electric-yellow *the* DevLab accent. The site now teaches two technologies side by side — Kafka and Go — and the reader benefits from a glance-level signal for which one a page, a highlight, or a figure is about.

**Decision.** Introduce **one** additional accent, `--color-go-blue` (`#00ADD8`, Go's own brand cyan, converted to oklch like every other token per ADR-0009 §1), plus its tint, ink, and glow tokens and a `.ds-mark-go` highlighter variant. The rule is *semantic, not decorative*: yellow stays the Kafka/brand accent everywhere; blue is used **only** to mark Go-the-language surfaces (the `/go` tier's eyebrows, marks, hooks, quiz, and any Go-specific figure). The build-state colour (`accent-green` for `live`, dashed-muted for `planned`) is untouched — it answers a different question ("does this run?") and must not be conflated with the technology accent.

- **Rejected — keep one accent, lean on icons/labels.** Smallest change, but forgoes the strongest, cheapest signal (colour) for distinguishing the two technologies the site now covers.
- **Rejected — recolour by arbitrary category (per-section palette).** Tempting, but a palette with no meaning becomes decoration that drifts. Tying the second accent to a *named technology with its own brand colour* keeps it principled and bounded — there is exactly one more accent, and it means "Go."

Pulse's own brand identity is unchanged: yellow remains the glow, the logo, the homepage. Go blue is a guest colour with a single, documented job.

## Consequences

- **The accent is bounded and meaningful.** The next technology that warrants its own accent (Kotlin, when `analytics` ships?) is a deliberate addition under this same rule — a *named* technology with a *brand* colour and a *Go-blue-style* token set — not a free-for-all. If accents ever start being chosen for variety rather than meaning, revisit.
- **`Go` follows `Learn`'s provenance model, with a twist.** It teaches a public language, so its `<Sources>` point outward (the Go spec, the Tour of Go, `confluent-kafka-go`). The pages are *grounded in* the `chat` service, so they also label the local `chat-mvp/*` issues — as plain text, never links, since the tracker is local-only (the existing rule).
- **The interactive-widget filter (ADR-0007) still binds.** Go pages earn interactive widgets only for genuinely dynamics-shaped ideas; the language idioms ship as static figures and TS↔Go code fences. The quiz is the one interactive widget, and it already has a story.
- **Build-state honesty is unaffected.** `Go` makes no claim about Pulse's running topology, so the honesty rule is satisfied the way ADR-0011 satisfied it for `Learn`: depict the universal mechanism (or the real `chat` code that genuinely shipped), never an un-built system.

## Revisit triggers

- **A third accent is proposed.** Re-read decision §2: is it a named technology with its own brand colour, or decoration creeping in?
- **The `Go` track stops being linear** — grows reference depth or branches — at which point reconsider whether it is still a "from a TS background" track or has become a second catalogue (the same trigger ADR-0011 set for `Learn`).
