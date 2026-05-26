# Pulse — Domain Context

Pulse is a real-time livestream platform built primarily as a learning project for Kafka and distributed-systems architecture. The product is a Twitch-style experience: creators stream, viewers watch and chat, and the platform reacts to a continuous flow of events around each stream.

## Glossary

### Media Plane
The path that carries the actual video and audio bytes from a creator's encoder to viewers' players. Built on standard streaming protocols (RTMP/WebRTC in, HLS/DASH/LL-HLS out) and a media server. **Kafka is not part of the media plane.** Frame data does not flow through Kafka.

### Control Plane
Everything *around* the stream: account lifecycle, follows, chat, emotes, notifications, analytics, recommendations, moderation. The control plane is event-driven and Kafka is its backbone. The control plane *observes* the media plane through lifecycle events (e.g. `StreamStarted`, `StreamEnded`, `ViewerJoined`) but does not transport media.

### Stream
A single live broadcast session by a creator. Has a lifecycle: scheduled → live → ended. Stream lifecycle transitions are first-class control-plane events.

### Channel
The creator's persistent identity that owns streams over time. A channel exists between streams; a stream is a single instance.

## Bounded contexts (services)

Pulse starts as three services, deliberately polyglot to force real contracts across the wire.

### `identity` — TypeScript / Node
Owns accounts, channels, and the follow graph. The user-facing API. Produces lifecycle events: `AccountCreated`, `ChannelCreated`, `FollowAdded`, `FollowRemoved`, `StreamScheduled`, `StreamStarted`, `StreamEnded`.

### `chat` — Go
WebSocket gateway and chat ingestion. Handles thousands of concurrent viewer connections per node. Produces `ChatMessageSent`, `EmoteReacted`, `ViewerJoined`, `ViewerLeft`. Consumes channel/stream state from `identity` to validate who can chat where.

### `analytics` — Kotlin + Kafka Streams
Pure stream-processing service. Consumes events from `identity` and `chat`; produces windowed aggregates (concurrent viewers, chat rate, top streams) as compacted topics that the dashboard reads from. No external API surface beyond a query layer over its state stores.

## Source-of-truth model

Pulse is deliberately hybrid: each bounded context picks the SoT model that fits its data shape.

- **`identity`** — Postgres is canonical. Events flow out via the **transactional outbox** pattern; the log is a notification stream, not the truth.
- **`chat`** — Kafka *is* the source of truth. Messages are an append-only log; redactions are additive events on a compacted side topic. Reads are served from projections (Redis ring buffer for mid-stream join; S3 chat-replay archives for VOD).
- **`analytics`** — No original state. State stores (RocksDB under Kafka Streams) are materialised views over upstream topics; loss is recovered by replay.

## Chat topology

| Topic | Key | Retention | Compacted | Purpose |
|---|---|---|---|---|
| `chat.messages.v1` | `channelId` | 7 days | No | Canonical message log |
| `chat.redactions.v1` | `messageId` | Forever | Yes | Moderation overrides, joined at read |
| `chat.presence.v1` | `channelId` | 1 day | No | Viewer join/leave |

**Projections off the chat log:**
- **Redis** — per-channel last-N ring buffer for mid-stream-join UX
- **S3 / MinIO** — per-stream chat archives written by an archiver consumer on `StreamEnded`

## Schemas & contracts

- **Format:** Avro. Chosen because Schema Registry is itself part of the lesson and Avro is its native format; the reader/writer schema resolution model is a core distributed-systems idea worth experiencing firsthand.
- **Registry:** Apicurio Registry (Apache-2.0 licensed, Confluent-compatible protocol), run locally in Docker.
- **Source of schemas:** monorepo, in `packages/schemas/`. Each service runs Avro codegen from the shared `.avsc` files at build time. The registry *enforces* compatibility (CI publishes and rejects on break); the `.avsc` files in the repo are the human-readable SoT.
- **Compatibility mode:** `BACKWARD` — producers can add optional fields with defaults; consumers can upgrade later.
- **Subject naming:** `TopicNameStrategy` — one event type per topic. Forces each event's lifecycle (retention, partitioning, consumers) to be designed independently.

## Repo layout

Monorepo. Operational cost of 3 separate repos for 3 services outweighs the boundary benefits.

```
pulse/
├── services/
│   ├── identity/       (TypeScript / Node)
│   ├── chat/           (Go)
│   └── analytics/      (Kotlin + Kafka Streams)
├── packages/
│   └── schemas/        (.avsc files, shared)
├── infra/              (docker-compose, k8s manifests, schema-registry config)
└── docs/
    └── adr/
```
