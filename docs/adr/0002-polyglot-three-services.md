# Polyglot three-service starting cut

Pulse starts as three services in three languages: `identity` (TypeScript/Node), `chat` (Go), `analytics` (Kotlin + Kafka Streams). The split is deliberate: three languages forces real wire contracts (Schema Registry becomes load-bearing, not optional), and each language is chosen to match the shape of its workload rather than for ecosystem uniformity.

## Considered options

- **Monolith with Kafka as internal bus.** Rejected: when everything is one process, the temptation to share types, share a DB, or call functions directly bypasses the distributed-systems lessons this project exists to teach. Kafka becomes an expensive RabbitMQ.
- **`chat` in Rust instead of Go.** Rejected: Rust's raw performance is better, but async Rust + lifetimes around long-lived WebSocket state competes for cognitive load with Kafka itself. Go's goroutines fit the workload (100k+ idle WebSockets per node) without dominating attention. Industry precedent — Twitch's own chat backend ran on Go.
- **`chat` in TypeScript/Node** for codebase uniformity with `identity`. Rejected: per-process WebSocket ceiling is much lower, forcing a cluster + sticky-session routing for any non-trivial concurrency — a problem Go doesn't have.
- **`analytics` as a stateless consumer writing to ClickHouse** (Path B). Rejected in favour of Kafka Streams: the KStream/KTable mental model and stateful windowed processing are *the* most distinctively Kafka-native pattern, and skipping them defeats half the point of using Kafka.
- **`analytics` in Python (Faust/Bytewax).** Rejected: Faust is unmaintained; Bytewax is niche. Choosing them means learning a fringe tool instead of Kafka.

## Consequences

- Schema Registry is mandatory from day 1; cross-language Avro codegen is part of the build pipeline for every service.
- Local dev environment must run three language toolchains. Mitigated by Dockerised infra (Kafka, registry, Postgres, Redis) plus services running natively.
- Adding a fourth service (notifications, moderation, recommendations) does not require choosing a fourth language — match shape to existing language when possible.
