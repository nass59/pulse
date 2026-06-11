# Monorepo orchestration via `just` (no Turborepo yet)

Pulse is a polyglot monorepo (TypeScript, Go, Kotlin). Cross-service orchestration lives in a single root `justfile`; each service uses its native toolchain (`bun`, `go`, `gradle`) underneath. Turborepo is deliberately deferred: at three services with one in each language, there is no cross-package build graph for Turborepo to optimise.

## Considered options

- **Turborepo as universal orchestrator.** Rejected: Turborepo's caching wins assume the JS-package model (workspace `package.json`, declared `inputs`/`outputs` per task). Wrapping `go build` and `gradle build` as Turbo tasks duplicates cache logic that Go and Gradle already do natively, and the inputs/outputs declarations are finicky for non-JS work — Bazel territory, overkill at three services.
- **Scoped Turborepo (JS only).** *Deferred, not rejected.* Becomes the right call when either (a) `packages/schemas/` starts producing TS artifacts consumed by `services/identity`, creating a real cross-package build dependency, or (b) the JS side grows beyond a single service. Today neither is true.
- **Bazel.** Rejected: the correct answer for serious polyglot monorepos, but the configuration cost would dominate the Kafka learning surface this project exists for.
- **`make` instead of `just`.** Rejected: `make` is designed around file/timestamp dependencies. Pulse explicitly delegates that logic to Go, Gradle, and npm. Using `make` would mean `.PHONY` ceremony on every target and tab-vs-space syntax landmines for no incremental gain. `just` is a purpose-built command runner; it matches the actual workload.
- **No root orchestrator at all.** Rejected: cross-service workflows (boot infra + run all services, run all tests, regenerate schemas) need a single entry point or the cognitive load decays into tribal-knowledge shell snippets.

## Consequences

- Root `justfile` is the documented entry point for any cross-service command. `just --list` becomes the table of contents for the repo's workflows.
- Each service keeps its own native toolchain configuration. The `justfile` delegates, it does not replace.
- CI builds each service independently. No `--affected` filtering — every CI run touches all three services. Acceptable at this scale; revisit if CI duration becomes painful.
- **Revisit trigger:** when the schema codegen pipeline (`packages/schemas/` → per-service generated code) becomes a real build dependency, evaluate scoped Turborepo for the TS side. That work lives in the `first-schemas` epic — write this ADR's successor (or amend it) at that point.