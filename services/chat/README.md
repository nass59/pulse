# chat

The chat gateway. Go on the network side: a WebSocket server that accepts viewer
connections, gates them on stream liveness, fans messages out to other viewers on the
same node, and produces three event types to Kafka — `ChatMessageSent`
(`chat.messages.v1`) plus presence (`ViewerJoined` → `chat.presence.joined.v1`,
`ViewerLeft` → `chat.presence.left.v1`).

The Kafka log is the source of truth — **everything the gateway produces is
server-authored**: the client supplies only a message `body` (for presence, merely the
act of opening or closing a gated socket), and the gateway stamps the channel/stream
identity, `userId`, and the timestamp. Every event is keyed by `channelId` so a
channel's messages and presence co-partition.

Liveness is learned, not asked: a per-instance consumer folds `stream.started.v1` /
`stream.ended.v1` into a live-channel map, which gates connections and supplies each
connection's `channelId`/`streamId` (the "wristband," captured at the gate). On
`StreamEnded` the channel's open sockets are force-closed (`1001`).

## Layout

| Path                 | What                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `main.go`            | process lifecycle: HTTP server, graceful shutdown, builds the producer + consumer                                                                |
| `server.go`          | the WebSocket handler, liveness gate, per-connection read/write loop, in-memory fan-out, presence                                                |
| `internal/producer/` | wraps `confluent-kafka-go`: Avro encode + Confluent wire format, async produce, delivery reports. One client, three topics (messages + presence) |
| `internal/consumer/` | per-instance full-replay consumer: folds stream-lifecycle events into the live-channel map                                                       |

## Prerequisites

- The dev lab running (`docker compose up -d` in `infra/`) — needs **Kafka** on
  `:9092` and **Apicurio** on `:8080`, both healthy.
- The Avro schemas published to Apicurio (`bun packages/schemas/scripts/publish.ts`).
- A C toolchain on PATH — `confluent-kafka-go` is cgo (wraps librdkafka). On macOS:
  `xcode-select --install`.
- For the runbook below: [`websocat`](https://github.com/vi/websocat) and
  [`kcat`](https://github.com/edenhill/kcat) (`brew install websocat kcat`).

## Configuration

All via env, with dev-friendly defaults:

| Var                   | Default                 | Notes                       |
| --------------------- | ----------------------- | --------------------------- |
| `PORT`                | `8081`                  | HTTP / WebSocket port       |
| `KAFKA_BROKERS`       | `localhost:9092`        | comma-separated broker list |
| `SCHEMA_REGISTRY_URL` | `http://localhost:8080` | Apicurio base URL           |

The producer fetches its three `-value` schemas (`chat.messages.v1`,
`chat.presence.joined.v1`, `chat.presence.left.v1`) from the registry at startup and
caches them. If any fetch fails the process **exits at boot** — deliberate: a gateway
that can't encode what it produces should not accept connections (ADR-0019). The
registry is a derived cache; if it was wiped (Apicurio's dev store is in-memory),
re-publish from the `.avsc` source of truth: `bun packages/schemas/scripts/publish.ts`
(idempotent).

## Run it

```bash
cd services/chat && go run .
```

Watch for `"msg":"listening","port":"8081"`. The `%4|...GETPID...retrying` line is
librdkafka acquiring its idempotence PID — transient, ignore it.

> Re-running? `go run .` holds the port; stop the old one first
> (`Ctrl-C`, or `pkill -f 'exe/chat'`) or you'll hit "address already in use".

## Verify the produce path (issue 03)

**1. Health:**

```bash
curl -s -w '\n%{http_code}\n' http://localhost:8081/health
```

**2. Send a message over the WebSocket** (`-n1` sends one line, then closes):

```bash
echo 'gg wp' | websocat -n1 ws://localhost:8081/ws/alices-channel
```

The server logs `ws connect` and — if all is well — **no** `produce failed`.

**3. Decode it off the log** with kcat:

```bash
kcat -C -b localhost:9092 \
  -s value=avro -r http://localhost:8080/apis/ccompat/v7 \
  -t chat.messages.v1 -o beginning -e
```

Flags that matter: `-C` forces consumer mode (kcat otherwise guesses producer and
errors); `-s value=avro` + `-r <registry>` deserialize the Avro value by resolving
the schema id in the 5-byte wire header; `-o beginning -e` read from the start and
exit at the end.

You get back the full server-authored record — your `body` plus the gateway-stamped
`messageId` (UUIDv7), `channelId`/`streamId`, `userId`, and `sentAt` (server receipt
time in epoch-millis).

### Prove per-channel co-partitioning

All messages for one channel must land on one partition (keyed by `channelId`,
murmur2-hashed — ADR-0014). Send several, then look at partition-per-key:

```bash
for i in 1 2 3; do echo "alice $i" | websocat -n1 ws://localhost:8081/ws/alices-channel; sleep 0.4; done

kcat -C -b localhost:9092 -t chat.messages.v1 -o beginning -e -f 'partition=%p key=%k\n' \
  | sort | uniq -c
```

Every `alices-channel` message shares one key and one partition. (No `-s/-r` here —
we only print the raw key, so the registry isn't needed.)

> **The wristband is real (issue 05).** `channelId`/`streamId` are identity's actual
> ids, learned from the stream-lifecycle log by the consumer and stamped on the
> connection at the gate. The produce path reads them off the connection, never a live
> lookup — which is what lets the `StreamEnded` force-close still emit a `ViewerLeft`
> after the map entry is gone (see below).

## Verify the liveness gate + presence (issues 05 & 06)

Presence needs a **live** channel, so this runbook also exercises the gate. It needs
`identity` running (HTTP `:3100`, produces the lifecycle events `chat` consumes).

**1. Start `identity` and `chat`** (separate terminals):

```bash
cd services/identity && bun start          # or: just identity-dev
cd services/chat     && go run .
```

`chat` replays the lifecycle log at boot and folds it to a live-channel map — watch for
`stream started` / `stream ended` lines settling. A fresh log usually folds to _empty_.

**2. Take a channel live** — produces `StreamStarted`, which `chat` consumes and admits:

```bash
curl -s -X POST localhost:3100/channels/alices-channel/go-live   # or: just identity-go-live
```

`chat` logs `stream started ... slug=alices-channel channelId=...`. (Without this, a
connect is rejected with close `1008` — that _is_ the gate working.)

**3. Connect a viewer and watch the join land.** A backgrounded `websocat` has an EOF
stdin and closes itself immediately, so pipe a long `sleep` in to hold the socket open
(macOS has no `timeout`):

```bash
sleep 60 | websocat ws://localhost:8081/ws/alices-channel &   # held open in the background
```

`chat` logs `ws connect`. Decode the join off its topic:

```bash
kcat -C -b localhost:9092 \
  -s value=avro -r http://localhost:8080/apis/ccompat/v7 \
  -t chat.presence.joined.v1 -o beginning -e \
  -f 'partition=%p key=%k value=%s\n'
```

You get a server-authored `ViewerJoined` — `channelId`/`streamId` (the wristband),
hardcoded `userId`, `joinedAt` (server clock, epoch-millis) — keyed by `channelId` and
on the **same partition** as that channel's messages (co-partitioned, ADR-0014).

**4. Clean leave.** Stop the viewer, then decode the leave topic:

```bash
pkill -f 'sleep 60'      # ends the held-open socket -> ws disconnect
kcat -C -b localhost:9092 \
  -s value=avro -r http://localhost:8080/apis/ccompat/v7 \
  -t chat.presence.left.v1 -o beginning -e -f 'partition=%p key=%k value=%s\n'
```

A `ViewerLeft` with matching identity and a `leftAt`.

**5. Force-close leave — the one that proves the design.** Hold a viewer open, then end
the stream from `identity`. `chat` deletes the live-map entry _first_, then force-closes
the socket — the `ViewerLeft` must still emit from the wristband on the connection:

```bash
sleep 60 | websocat ws://localhost:8081/ws/alices-channel &   # a live viewer
sleep 1
curl -s -X POST localhost:3100/channels/alices-channel/end-stream   # or: just identity-end-stream
```

`chat` logs `force-closing channel ... conns=1` and closes the socket with `1001`.
Re-read `chat.presence.left.v1` (step 4's kcat): the newest `ViewerLeft` carries the
**force-closed** `streamId` — proof it was built from the connection's wristband, not a
live-map lookup that would have found nothing.

## Relevant decisions

- **ADR-0014** — all producers use murmur2 partitioning (`partitioner=murmur2_random`
  here, since librdkafka defaults to CRC32).
- **ADR-0017** — `chat`'s consumer is an ephemeral, per-instance, full-replay group
  (a fresh group id every boot) — it rebuilds the live-channel map from the whole log,
  not a shared offset. Why a stable group id would silently rebuild an _incomplete_ map.
- **ADR-0018** — WebSocket fan-out is best-effort; the Kafka log is the durable record.
- **ADR-0019** — fail fast at boot if the schema registry is unreachable, but
  tolerate a transient broker (why the schema fetch crashes startup and a down Kafka
  doesn't).
- **ADR-0004 / 0012** — schema strategy and the stream-topic topology (`channelId`
  keying, retention).
