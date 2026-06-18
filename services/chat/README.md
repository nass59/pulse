# chat

The chat gateway. Go on the network side: a WebSocket server that accepts viewer
connections, fans messages out to other viewers on the same node, and produces
every message to Kafka (`chat.messages.v1`).

The Kafka log is the source of truth — the gateway mints a fully **server-authored**
`ChatMessageSent` for each message (client supplies only `body`) and produces it
keyed by `channelId` for per-channel ordering.

## Layout

| Path                 | What                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| `main.go`            | process lifecycle: HTTP server, graceful shutdown, builds the producer                           |
| `server.go`          | the WebSocket handler, per-connection read/write loop, in-memory fan-out                         |
| `internal/producer/` | wraps `confluent-kafka-go`: Avro encode + Confluent wire format, async produce, delivery reports |

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

The producer fetches the `chat.messages.v1-value` schema from the registry at
startup and caches it. If that fetch fails the process **exits at boot** —
deliberate: a gateway that can't encode its own messages should not accept
connections.

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

> **MVP placeholder:** `channelId`/`streamId` are derived deterministically from the
> channel slug (UUIDv5) and captured on the connection at join — the "wristband."
> They become real once the stream-lifecycle consumer lands (issue 05); the shape on
> the connection doesn't change, only the source.

## Relevant decisions

- **ADR-0014** — all producers use murmur2 partitioning (`partitioner=murmur2_random`
  here, since librdkafka defaults to CRC32).
- **ADR-0018** — WebSocket fan-out is best-effort; the Kafka log is the durable record.
- **ADR-0019** — fail fast at boot if the schema registry is unreachable, but
  tolerate a transient broker (why the schema fetch crashes startup and a down Kafka
  doesn't).
- **ADR-0004 / 0012** — schema strategy and the stream-topic topology (`channelId`
  keying, retention).
