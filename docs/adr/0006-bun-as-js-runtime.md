# Bun as the JS/TS runtime and package manager

The TypeScript service (`identity`) and any future TS code uses **Bun** as both runtime and package manager — replacing the conventional Node + pnpm/npm stack. This supersedes the "TypeScript/Node" wording in ADR-0002.

## Considered options

- **Node + pnpm (the conventional choice).** Rejected: four moving parts — Node runtime, pnpm install, `tsx` for dev-time TS execution, Vitest for tests — for a learning project where the JS toolchain is *not* the lesson. Each tool is fine in isolation; the combination is more cognitive overhead than the work justifies at this scale.
- **Node + npm.** Rejected: same drawback as pnpm plus weaker workspace ergonomics and slower installs. No reason to pick it over pnpm if we were staying on Node.
- **Deno.** Rejected: better TypeScript story than Node, but its npm-compat layer adds a translation step for any Kafka/Postgres client, and the ecosystem fluency around Kafka tooling is worse than Bun's at the time of this decision.
- **Bun for `chat` instead of Go.** Rejected — this is what ADR-0002 already considered as "chat in TypeScript/Node" and rejected. Bun's WebSocket implementation narrows the gap with Go (`Bun.serve` ws is much faster than Node's `ws`), but it does not change the cognitive-model argument: Go's goroutine-per-connection model is fundamentally different from any JS event loop, and that contrast is part of why ADR-0002 split the languages. The Bun-vs-Node delta is performance; the Go-vs-JS delta is architecture.

## Consequences

- All TS commands across the repo use `bun`: `bun install`, `bun run <script>`, `bun test`, `bun add <pkg>`, `bun --hot src/index.ts` for dev with reload.
- Workspaces live in a single root `package.json` (`workspaces` field). No `pnpm-workspace.yaml` or equivalent.
- Default Kafka client is **`kafkajs`** (pure JS, no native bindings, clean on Bun). Reach for `confluent-kafka-javascript` (which wraps `librdkafka` via N-API) only if a real performance ceiling forces it — and at that point runtime choice is the secondary question.
- ADR-0002's text describing `identity` as "TypeScript/Node" is superseded by this ADR. The reasoning of ADR-0002 (why three languages, why Go for chat, why Kotlin for analytics) still stands; only the runtime under `identity` changes.
- **Risk to monitor:** Bun is a younger runtime than Node. Edge-case incompatibilities with native modules or Node-internals-aware libraries can surface. Mitigation: prefer pure-JS dependencies; if a specific dependency forces Node, isolate that fallback to one service without revisiting the whole decision.