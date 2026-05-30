# Storybook for interactive-component isolation in `apps/docs/`

Interactive widgets in `apps/docs/` (Motion animations, `@xyflow/react` diagrams) are developed and documented **in isolation via Storybook** (`@storybook/nextjs-vite`), not via a throwaway in-site `/demo` route. Storybook is the *isolation/documentation* surface; the site's MDX pages remain the *integration* surface, where the server-component-with-client-leaf pattern is proven for real (see [ADR-0007](./0007-docs-site-as-study-artifact.md) for the site's purpose).

## Considered options

- **Throwaway `/demo` MDX page** (the original issue-02 plan). Rejected as the permanent home: it ships a junk route into the static export, and a routed page of trivial animation is exactly the "infinite Motion practice" bloat ADR-0007 tells us to resist. The MDX *bridge* still has to be proven somewhere — but that proof belongs on real content pages, not a demo.
- **Storybook as a full replacement for the MDX-bridge proof.** Partially adopted. Storybook replaces the demo *page*, but it cannot exercise `mdx-components.tsx` or the Next app-router server/client boundary — it renders components in its own React harness. So the bridge proof is **not skipped, it is relocated** to issue 03's real content pages, which embed real widgets in server-rendered MDX. (This is arguably better: the pattern is proven with a widget that has to earn its place, not a pulsing dot.)
- **No isolation surface — build widgets only inside MDX.** Rejected: as the widget library grows past two, a surface that renders one widget in isolation with controls and a11y checks pays for itself; loading a whole content page to eyeball a single component is slow feedback.
- **A lighter tool (Ladle, bare Vite).** Rejected: `@storybook/nextjs-vite` gives first-class `next/font`, Tailwind v4, and React 19 support plus `addon-docs`/`addon-a11y` out of the box; the lighter alternatives would need manual wiring for marginal weight savings.

## Consequences

- A second build toolchain (Vite-based **Storybook 10**) lives in `apps/docs/` alongside Next. New `just docs-storybook` target; `storybook-static/` is gitignored. This is a deliberate, accepted tension with ADR-0007's "resist letting the site become a UI side-project" — justified because isolated *documentation* of widgets serves the study artifact rather than detouring from it.
- The default `create-storybook` install pulled a heavy kit (`addon-vitest` + Playwright browsers, Chromatic, `addon-mcp`). For a study artifact rendering a handful of widgets, the documentation essentials are `addon-docs` and `addon-a11y`; the rest are candidates to trim unless a concrete use emerges.
- **The server-component-with-client-leaf lesson** (epic lesson #2; original issue-02 acceptance criteria 4–6) **migrates to issue 03**, where it is proven against real content. `mdx-components.tsx` stays an empty registry until then.
- Widget files use kebab-case filenames (`motion-demo.tsx`) per the repo's Ultracite convention, exporting PascalCase components — matching the existing `components/ui/*.tsx` shape.
