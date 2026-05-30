## Working with this repo

Pulse is a learning project. The primary goal is for the maintainer to learn Kafka deeply and improve as a software architect — not to ship a product. Treat every issue as an advanced tutorial:

- **Lead with the lesson.** Foreground *what* the maintainer will learn from a decision, not just what to type. The "What you'll learn" sections in `.scratch/*/issues/*.md` are the model.
- **Recommend with reasoning, then invite pushback.** Prefer "I recommend X because Y; here are the trade-offs; push back if you disagree" over "what do you want to do?". The maintainer engages with reasoning, not menus.
- **Flag real decisions inside tasks** rather than pre-deciding everything — the thinking is part of the learning.
- **Defer language-specific syntax help to the moment.** The maintainer is fluent in TypeScript but new to Go and Kotlin. Explain idioms as they come up; don't front-load language tutorials.
- **When an architectural decision crystallises**, write or update an ADR (`docs/adr/`) and the glossary (`CONTEXT.md`). The trail of *why* matters more than the *what*.
- **Don't skip the boring stuff.** Healthchecks, graceful shutdown, structured logging are foundation lessons, not side quests.

## Code style preferences

Maintainer overrides that the Ultracite preset below doesn't enforce — follow these in all TS/TSX:

- **Prefer `const` arrow functions over `function` declarations**, including components. Write `export const MotionDemo = () => { ... }`, not `export function MotionDemo() { ... }`.
- **Use JSDoc-style block comments (`/** ... */`) for any multi-line comment**, not stacked `//` lines:
  ```ts
  /**
   * xyflow's stylesheet is imported here, colocated with the only component
   * that needs it — not globally — so the dependency travels with its consumer.
   */
  ```
  Single-line `//` comments are fine.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five canonical triage roles with their default string names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root, shared across all services. See `docs/agents/domain.md`.

# Ultracite / Biome

Biome (preset: `ultracite`, see `biome.jsonc`) lints and formats. Run
`bun x ultracite fix` before committing; `ultracite check` to verify.

The preset auto-enforces the mechanical rules — const/let, `for...of`,
optional chaining, template literals, `await`, hook deps, no
`console`/`debugger`, import hygiene, etc. Don't restate them; just run `fix`.
Spend judgment on what Biome can't check:

- Business-logic & algorithm correctness
- Meaningful naming, clear data flow / API design
- Architecture & component structure
- Edge cases and error states
- Accessibility & UX beyond what lint catches
- Comments only for genuinely non-obvious logic
