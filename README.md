# Pulse

Pulse is a learning project: a Twitch-style real-time livestream platform built to learn Kafka and distributed-systems architecture deeply. Three polyglot services (TypeScript, Go, Kotlin) talk through a Kafka-backed control plane; the media plane (the actual video bytes) deliberately lives outside Kafka.

This isn't a product. Each issue is treated as an advanced tutorial — the trail of *why* matters more than the *what*.

## Quick start

Spin up the local infrastructure (Kafka in KRaft mode, Apicurio schema registry, Postgres, Redis):

```bash
just infra-up
just infra-ps   # all four should report (healthy)
```

Tear it down with `just infra-down` (the Postgres named volume is preserved; add `-v` to the underlying `docker compose down` to wipe it).

## Where to look first

- **[`CONTEXT.md`](./CONTEXT.md)** — domain glossary, bounded contexts, source-of-truth model, schema strategy, chat topology.
- **[`docs/adr/`](./docs/adr/)** — architectural decision records. The reasoning behind every load-bearing choice.

## Repo layout

```
services/
  identity/       TypeScript / Node    — accounts, channels, follows
  chat/           Go                   — WebSocket gateway, chat ingestion
  analytics/      Kotlin + Streams     — windowed aggregates
packages/
  schemas/                              — shared Avro schemas (.avsc)
infra/                                  — docker-compose, k8s, registry config
docs/
  adr/                                  — architectural decision records
```
