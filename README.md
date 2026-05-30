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

## Smoke test

Prove the broker is reachable from the host before building anything on top of it. With infra up, use [`kcat`](https://github.com/edenhill/kcat) (`brew install kcat`) to round-trip a message through the `EXTERNAL://localhost:9092` listener:

```bash
# Produce (auto-creates the topic on first write)
echo "hello pulse" | kcat -P -b localhost:9092 -t pulse.smoke.test

# Consume from the start of the log, then exit at the end
kcat -C -b localhost:9092 -t pulse.smoke.test -o beginning -e
```

The consume should print `hello pulse`. Reading does not remove the record — Kafka's log is append-only and retained, so `-o beginning` replays every message produced so far.

Confirm the Apicurio schema registry is live:

```bash
curl http://localhost:8080/apis/registry/v2/system/info
```

It should return JSON with the registry name and version.

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
