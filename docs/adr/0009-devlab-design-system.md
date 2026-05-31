# DevLab design system for the docs surface

`apps/docs/` adopts **DevLab** — the developer-facing design language reconstructed from the Pulse Figma frames (Experiment Browser, Article, Component Library) via Claude Design. DevLab is warm carbon neutrals, a single electric-yellow accent, a strict two-typeface system (Spline Sans + JetBrains Mono), pill buttons, the flask logo, and a signature yellow glow on dark. It re-skins the generic shadcn `base-nova` scaffold the docs site shipped with (see [ADR-0007](./0007-docs-site-as-study-artifact.md) for why the site exists, [ADR-0008](./0008-storybook-for-component-isolation.md) for the Storybook surface).

This ADR records three decisions that were genuine trade-offs and are awkward to reverse once content and components depend on them.

## 1. Tokens are converted to oklch and mapped onto shadcn's semantic names

DevLab ships exact hex/rgba values with its own token names (`--electric-yellow`, `--carbon-900`, `--fg1`). The repo already reasons in oklch via shadcn + Tailwind v4 `@theme inline`.

**Decision:** convert every DevLab colour to oklch (computed, not eyeballed) and redefine shadcn's semantic tokens (`--primary`, `--background`, `--card`, `--border`, `--muted-foreground`…) to those values, so existing shadcn components reskin for free. Raw brand tokens are *also* exposed via `@theme` (`--color-electric-yellow`, `--color-carbon-*`, `--shadow-glow-*`, `--radius-pill`) for direct use in new components. The yellow glow stays in-space as `oklch(0.9424 0.2032 108.53 / α)`.

- **Rejected — keep exact hex, map onto shadcn names.** Highest byte-fidelity to the brand, but splits the codebase across two colour spaces (oklch greys vs hex brand) and forfeits the ability to reason in oklch lightness/chroma. One space is the more honest system.
- **Rejected — parallel DevLab token layer beside untouched shadcn tokens.** Two systems coexisting means every shadcn component stays grey until individually migrated; the reskin never actually lands.

The cost: the source hex values no longer appear verbatim in the codebase, so cross-referencing the design bundle's `colors_and_type.css` requires the conversion table (recorded in the token comments in `globals.css`).

## 2. Both surfaces default to the light editorial theme, with a working theme toggle

DevLab is "dark-mode-native but light-mode-fluent": its Blog and Experiment Browser surfaces are light/paper, its Component Library surface is the dark "lab" where the glow lives.

**Decision:** the docs site and Storybook both **default to the light editorial surface**, and ship a working theme-toggle (the bottom-right FAB on the site; a toolbar in Storybook) so the dark lab is one click away. A pre-paint inline script applies the saved theme to avoid a flash.

This **overrides ADR-0007's "dark-mode toggle: out of scope"** line. The rationale: the docs are long-form distributed-systems tutorials — reading happens best on paper-white — but the brand's identity (and the glow) lives on dark, so deferring the toggle entirely would have hidden half the design language. Shipping the toggle now, rather than a one-way dark-native default, keeps the resting state legible while making the lab reachable.

- **Rejected — dark-native everywhere.** Most dramatic and most on-brand for "the lab", but tutorial prose on black is a worse default for the site's actual job.
- **Rejected — light only, defer the toggle (per ADR-0007).** Keeps the original scope but never surfaces the dark surface or the glow that define DevLab.

## 3. The callout taxonomy is Pulse-tuned, not DevLab-verbatim

DevLab's README defines callouts as **Key Concept · Core Concept · Performance Note · Accessibility Note · Implementation Details** — a frontend-flavoured vocabulary. The docs site already had **Note · Lesson Learned · Footgun in Production**, tied to the repo's ethos ("the trail of *why* matters more than the *what*").

**Decision:** render callouts in DevLab's *visual* grammar (tinted box, hairline border, line icon, mono UPPERCASE label) but carry a **Pulse-tuned variant set**: `note` (neutral default), `key` (Key Concept), `perf` (Performance Note), `lesson` (Lesson Learned), `footgun` (Footgun in Production). "Accessibility Note" / "Core Concept" / "Implementation Details" are dropped as ill-fitting for Kafka content; "Footgun in Production" is kept as the project's signature.

These are doc-presentation variants, not domain glossary terms, so they are deliberately **not** added to `CONTEXT.md`.

- **Rejected — adopt DevLab's set verbatim.** Maximum fidelity to the design source, but loses "Footgun in Production" and saddles distributed-systems pages with "Accessibility Note".
- **Rejected — keep the old three unchanged.** Smallest change, but forgoes "Key Concept" / "Performance Note", which earn their place on concept pages.

## Consequences

- Fonts are self-hosted as the bundled Spline Sans + JetBrains Mono variable TTFs via `next/font/local` (Geist retired) — exact brand files, no external fetch, clean for static export.
- Buttons are stadium-shaped (`rounded-pill`) by default and carry the glow on dark; the `CssCheck` story now asserts `9999px`. Cards are 16px with a warm hairline border. The flask + `DevLab.ui` lockup is the brand mark in the header and footer.
- Fenced code blocks render dark on every surface via a `CodeBlock` client component mapped onto MDX `pre` (terminal-style is part of the identity); it carries a copy affordance.
- Storybook gains a `Design System/Foundations` set (colours, type, spacing/radii, shadows/glow) plus stories for the new components, and a theme toolbar mirroring the site.
- The design bundle (`devlab-design-system/`, including the `devlab-design` Agent Skill and the three UI kits) is the visual source of truth for future surfaces; it is not committed here — this ADR plus `globals.css` are the durable record.
