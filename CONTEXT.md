# Pulse — Domain Context

Pulse is a real-time livestream platform built primarily as a learning project for Kafka and distributed-systems architecture. The product is a Twitch-style experience: creators stream, viewers watch and chat, and the platform reacts to a continuous flow of events around each stream.

## Glossary

### Media Plane

The path that carries the actual video and audio bytes from a creator's encoder to viewers' players. Built on standard streaming protocols (RTMP/WebRTC in, HLS/DASH/LL-HLS out) and a media server. **Kafka is not part of the media plane.** Frame data does not flow through Kafka.

### Control Plane

Everything _around_ the stream: account lifecycle, follows, chat, emotes, notifications, analytics, recommendations, moderation. The control plane is event-driven and Kafka is its backbone. The control plane _observes_ the media plane through lifecycle events (e.g. `StreamStarted`, `StreamEnded`, `ViewerJoined`) but does not transport media.

### Fan-out plane

The path that carries a chat message from the gateway node that received it to the viewers connected to *other* gateway nodes, live. Since Phase 2 `chat` runs as N independent nodes, and a node's WebSocket connections are visible only to itself — so "reach everyone watching this channel, right now" is a cross-node problem, and the fan-out plane is what solves it. It is **Redis pub/sub**, keyed `chat:fanout:{channelId}` ([ADR-0024](docs/adr/0024-redis-pubsub-as-the-cross-node-fanout-plane.md)), and it is the **courier, never the record** — see Courier vs record. _Avoid:_ "the Redis channel is where chat lives"; deriving any state from the fan-out plane.

### Courier vs record

The division of labour behind every real-time surface in Pulse. The **record** is the durable, ordered, replayable copy — always a Kafka topic (`chat.messages.v1` for chat). The **courier** is whatever gets the message to connected clients *this instant* — Redis pub/sub, which is at-most-once, has no retention, no replay, and no acknowledgement. Those are disqualifying properties for a record and ideal ones for a courier: nothing is durable on the live plane because it doesn't have to be, the truth was written to Kafka before the publish happened.

The rule that follows: **anything derived from the log survives a node restart and is rebuildable by replay; anything that lived only in a process or on the courier's wire does not, and must never be the only copy.** So every read model — the ring buffer, the archives, every analytics aggregate — is built by consuming Kafka, never by listening to the courier. A feature tempted to build state off the fan-out channel is a feature that should be a Kafka consumer. _Avoid:_ treating Redis as a message queue for chat; adding delivery guarantees to the live plane (that is rebuilding Kafka inside it).

### Stream

A single live broadcast session by a creator. Has a lifecycle: scheduled → live → ended. Stream lifecycle transitions are first-class control-plane events.

A channel has **at most one live stream at a time** — streams are strictly sequential, never concurrent, and `identity` rejects a go-live on an already-live channel. This is a relied-upon contract, not an incidental property: `chat` can track liveness per `channelId` (a single live stream per channel), and because lifecycle events are co-partitioned and per-channel ordered, a channel's `start → end → start` always arrives in that order — so liveness keyed by `channelId` alone is correct.

### Channel

The creator's persistent identity that owns streams over time. A channel exists between streams; a stream is a single instance.

### Slug

A channel's stable, human-readable public address (e.g. `alices-channel`) — unique, owned by `identity`. The `channelId` (a uuid) is the internal identity used for partitioning and joins; the slug is what a viewer's URL carries. The two are distinct: viewers connect to `/ws/{slug}`, but every event is keyed by `channelId`. Because `chat` must map one to the other without querying `identity`, the slug travels **inside** the stream-lifecycle events (see Chat topology). _Avoid:_ using the slug as a partition key or treating it as mutable identity.

### Viewer

An account in its stream-watching role — _not_ a distinct entity. The same `userId` identifies a person whether they are watching, chatting, or following; there is no separate viewer identity and no anonymous viewing (an account is required to watch). _Avoid:_ a separate `viewerId`, "viewer account."

Viewer is the _identity_ (who is watching). The _unit of presence_ — what "concurrent viewers" counts — is the **Viewer session**, not the account.

### Viewer session

A single live WebSocket connection from a viewer to `chat`. It is the unit of presence: `ViewerJoined` is emitted when a session opens and passes the liveness gate, `ViewerLeft` when it closes (for any reason), and "concurrent viewers" is the count of currently-open sessions — which `analytics` approximates via windowing. The count is **approximate by design**: a `ViewerLeft` can be lost (a node that dies without flushing leaves a join with no matching leave), so join and leave are not a balanced ledger — windowing tolerates this by ageing an unmatched join out of the count rather than letting it inflate forever. Concretely, `analytics` counts presence over a **trailing horizon `W`** (a hopping window — see [ADR-0022](docs/adr/0022-concurrent-viewer-windowed-approximation.md)): a join contributes to the count for `W` after it lands, then ages out. Because the MVP carries **no heartbeat** — `chat` emits one join on socket-open and one leave on socket-close, nothing between — an ageing horizon cannot tell a _lost leave_ apart from a _still-watching_ session (both read as "join, no matching leave"). So the count is precisely **"sessions that joined within the last `W` and have not since left"**: it self-heals a lost leave (the dangling join ages out) at the cost of **undercounting a session that has watched longer than `W`**. Periodic presence heartbeats would make long sessions first-class — deferred to Phase 2. One account may hold several simultaneous sessions (e.g. two browser tabs), and each counts; presence is session-grained, not account-grained. (In the MVP the `userId` is hardcoded, so every session shares one account — the count still reflects sessions, which is the point.) _Avoid:_ deduplicating presence by `userId`; treating presence as a balanced ledger — reconciling or synthesising leaves for dangling sessions to make the count exact fights the windowed, approximate design that pushes crash-consistency downstream on purpose; or treating "viewer count" as "distinct accounts watching."

## Bounded contexts (services)

Pulse starts as three services, deliberately polyglot to force real contracts across the wire.

### `identity` — TypeScript / Bun

Owns accounts, channels, and the follow graph. The user-facing API. Produces lifecycle events: `AccountCreated`, `ChannelCreated`, `FollowAdded`, `FollowRemoved`, `StreamScheduled`, `StreamStarted`, `StreamEnded`.

### `chat` — Go

WebSocket gateway and chat ingestion. Handles thousands of concurrent viewer connections per node. Produces `ChatMessageSent`, `EmoteReacted`, `ViewerJoined`, `ViewerLeft`. Consumes channel/stream state from `identity` to validate who can chat where.

Runs as **N independent nodes** (Phase 2). A node's connection registry is local to its process and keyed by `channelId`; reaching viewers on the other nodes is the job of the fan-out plane ([ADR-0024](docs/adr/0024-redis-pubsub-as-the-cross-node-fanout-plane.md)). Fan-out has exactly **one** call site — the Redis subscriber — on every node, including the one that received the message; the inbound handler only produces to Kafka and publishes. Liveness needs no cross-node work: each node replays the lifecycle topics under a fresh-per-boot consumer group, so every node independently materialises the same live-channel map.

This liveness gate is **eventually consistent**: `chat` learns a channel is live by consuming `stream.started.v1` / `stream.ended.v1`, so it lags `identity` by its own consumer lag. Two windows follow and are accepted deliberately (the alternative — a synchronous check against `identity` — is the coupling we're avoiding): a viewer who connects between `StreamStarted` and `chat` consuming it is rejected (close `1008`) though the channel is genuinely live; a message sent on a still-open socket between `StreamEnded` and its consumption is produced against an already-ended `streamId`. Both are self-healing (the client retries the upgrade). On `StreamEnded`, `chat` force-closes the channel's open connections with close code `1001` ("going away").

### `analytics` — Kotlin + Kafka Streams

Pure stream-processing service. Consumes events from `identity` and `chat`; produces windowed aggregates (concurrent viewers, chat rate, top streams). The eventual dashboard-facing shape is a **compacted current-value projection** (latest per stream), but the first aggregate — `analytics.viewer-count.v1` — currently ships as a **delete-retention update stream**: every hopping-window update is emitted, because a hopping window produces several live windows per key and a clean compacted "current count" needs composite keying or window-final suppression (deferred — see [ADR-0022](docs/adr/0022-concurrent-viewer-windowed-approximation.md)). The windowed store key is internal; the topic carries a projected Avro `ViewerCount` record. No external API surface beyond a query layer over its state stores.

## Source-of-truth model

Pulse is deliberately hybrid: each bounded context picks the SoT model that fits its data shape.

- **`identity`** — Postgres is canonical. Events flow out via the **transactional outbox** pattern; the log is a notification stream, not the truth. The relay is an in-process polling loop ([ADR-0013](docs/adr/0013-in-process-polling-outbox-relay.md)); CDC is deferred to Phase 3.
- **`chat`** — Kafka _is_ the source of truth. **Everything `chat` produces is server-authored** — messages _and_ presence (`ViewerJoined`/`ViewerLeft`, and `EmoteReacted` to come): the client never names the channel/stream identity, never supplies a `userId`, and never supplies a timestamp. The gateway stamps all of them; the client's only input is a message `body` (for presence, merely the act of opening or closing a gated socket). Authorship therefore cannot be forged and an event cannot be backdated. For a chat message the gateway stamps `messageId`, `userId`, the channel/stream identity, and `sentAt` as **server receipt time** (never a client clock) — and because `sentAt` is the gateway's own clock, a channel's messages are totally ordered as the gateway saw them; presence timestamps (`joinedAt`/`leftAt`) are likewise the gateway's clock. Redactions are additive events on a compacted side topic. Reads are served from projections (Redis ring buffer for mid-stream join; S3 chat-replay archives for VOD).
- **`analytics`** — No original state. State stores (RocksDB under Kafka Streams) are materialised views over upstream topics; loss is recovered by replay.

## Chat topology

| Topic                     | Key         | Retention | Compacted | Purpose                              |
| ------------------------- | ----------- | --------- | --------- | ------------------------------------ |
| `chat.messages.v1`        | `channelId` | 7 days    | No        | Canonical message log                |
| `chat.redactions.v1`      | `messageId` | Forever   | Yes       | Moderation overrides, joined at read |
| `chat.presence.joined.v1` | `channelId` | 1 day     | No        | Viewer-session open events           |
| `chat.presence.left.v1`   | `channelId` | 1 day     | No        | Viewer-session close events          |

Presence is **split into two topics**, not one `chat.presence.v1` carrying both — one event type per topic, per [ADR-0004](docs/adr/0004-schema-strategy.md). The alternative (a single `chat.presence.v1` with a `ViewerPresenceChanged { kind }` envelope) would give per-channel total ordering of join/leave, but presence is consumed by `analytics` as a windowed, approximate concurrent-viewer count, so single-partition ordering buys nothing worth a `TopicNameStrategy` exception.

**Projections off the chat log:**

- **Redis** — per-channel last-N ring buffer for mid-stream-join UX
- **S3 / MinIO** — per-stream chat archives written by an archiver consumer on `StreamEnded`

Redis appears twice in `chat`'s design and the two uses must not be conflated: as the **fan-out plane** (pub/sub, the courier, nothing derived from it) and as the **home of a projection** (the ring buffer, built by a consumer of `chat.messages.v1` — off the log, not off the pub/sub stream). Same infrastructure, opposite roles.

## Schemas & contracts

- **Format:** Avro. Chosen because Schema Registry is itself part of the lesson and Avro is its native format; the reader/writer schema resolution model is a core distributed-systems idea worth experiencing firsthand.
- **Registry:** Apicurio Registry (Apache-2.0 licensed, Confluent-compatible protocol), run locally in Docker.
- **Source of schemas:** monorepo, in `packages/schemas/`. Each service runs Avro codegen from the shared `.avsc` files at build time. The registry _enforces_ compatibility (CI publishes and rejects on break); the `.avsc` files in the repo are the human-readable SoT.
- **Compatibility mode:** `BACKWARD` — producers can add optional fields with defaults; consumers can upgrade later.
- **Subject naming:** `TopicNameStrategy` — one event type per topic. Forces each event's lifecycle (retention, partitioning, consumers) to be designed independently.
- **Event → topic mapping** is owned by the `EVENT_TOPICS` map in `packages/schemas/topics.ts` — the single executable source of truth shared by producers, consumers, the registry publisher (`scripts/publish.ts`), and the topic provisioner (`scripts/provision-topics.ts`). Its sibling `TOPIC_CONFIGS` holds each topic's partition count and retention, which provisioning reads. This document records only _domain_ decisions about a topic (keying, retention, compaction, and the rationale), never the bare mapping, which would inevitably drift.

**Stream lifecycle topics:** `StreamStarted` and `StreamEnded` are two separate topics (`stream.started.v1`, `stream.ended.v1`), produced by `identity`.

| Topic               | Key         | Retention | Compacted | Purpose              |
| ------------------- | ----------- | --------- | --------- | -------------------- |
| `stream.started.v1` | `channelId` | 7 days    | No        | Channel went live    |
| `stream.ended.v1`   | `channelId` | 7 days    | No        | Channel stream ended |

Both are **keyed by `channelId`**, deliberately co-partitioned with the chat topics so a channel's stream-state and its chat land on the same partition — the precondition for joining stream-state against the chat stream in `analytics` without a repartition. Retention is 7-day **delete, not compacted**: these are immutable lifecycle _facts_, not a current-state snapshot, and Postgres holds the canonical `streams` history, so the log needs no permanent record for state reconstruction. Keying, retention, and the system-wide partition count are recorded in [ADR-0012](docs/adr/0012-stream-lifecycle-topic-topology.md).

Both events also carry the channel's **`channelSlug`** in their payload. `chat` accepts viewer connections by slug but tracks liveness and produces by `channelId`; carrying the slug in the lifecycle event lets `chat` build its `slug → channelId` mapping purely from the log, with no synchronous call back to `identity`. The slug is denormalized channel reference data riding along with the lifecycle fact — the consumer's needs, not the producer's, shape the payload.

## Repo layout

Monorepo. Operational cost of 3 separate repos for 3 services outweighs the boundary benefits.

```
pulse/
├── services/
│   ├── identity/       (TypeScript / Bun)
│   ├── chat/           (Go)
│   └── analytics/      (Kotlin + Kafka Streams)
├── packages/
│   └── schemas/        (.avsc files, shared)
├── infra/              (docker-compose, k8s manifests, schema-registry config)
└── docs/
    └── adr/
```
