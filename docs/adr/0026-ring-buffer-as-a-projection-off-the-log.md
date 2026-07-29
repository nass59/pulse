# the chat history ring buffer is a projection off the log, not an inline write

A viewer joining a channel mid-stream should see recent history, not a blank box.
That history — the last N messages per channel — is maintained by a **dedicated
consumer of `chat.messages.v1`** that, per message, `LPUSH`es a JSON record onto
the Redis list `chat:history:{channelId}` and then `LTRIM`s it to the last N
(N = 50). The list is a fixed-size ring buffer: newest at the head, oldest
discarded automatically.

The history is **derived from the log**, not written on the request path. The
inbound WebSocket handler is unchanged — it still produces to `chat.messages.v1`
and publishes to the fan-out plane (ADR-0024), and nothing more. Backfilling a
joiner from this list is a separate concern (`chat-multi-node/04`).

## Why a consumer, not an inline `LPUSH`

The tempting implementation is one `LPUSH` inside the message handler, right next
to the produce — one fewer moving part, no consumer to run. Rejected, for two
reasons that are the same reason:

- **It couples history to the fan-out path.** A message that produces to Kafka but
  fails to `LPUSH` (or the reverse) desyncs history from the record. The log and
  its read model would drift, silently, per failure.
- **It is lost with the node.** In-handler state belongs to the node that received
  the message; if that node dies mid-write, that history is gone and unrebuildable.

Consuming the log instead makes the ring buffer a **pure function of
`chat.messages.v1`**: it survives any gateway restart, it stays exactly consistent
with the durable record, and it is rebuildable by replaying the topic from the
start. That is the definition of a projection, and it is the rule ADR-0024 ends
on — *anything derived from the log survives a restart; the fan-out stream is
never derived from*. This is the first read model to honour it, and it is built
off the log, not off the courier.

A second payoff: the projection is written **once across the fleet**, not once per
node (see the group id below), where an inline write would `LPUSH` N times for N
gateways all handling the same channel's sockets.

## The consumer group is the mirror image of the liveness consumer

`chat` already runs one Kafka consumer — the liveness view (`internal/consumer`),
which tracks which channels are live. This projection is a second consumer with the
**opposite** group configuration, and the contrast is the point:

| | liveness consumer | history projection |
| --- | --- | --- |
| `group.id` | fresh per boot (`chat-gateway-{host}-{bootId}`) | stable, shared (`chat-history`) |
| `enable.auto.commit` | `false` — never remember position | `true` — resume from committed offset |
| effect across N nodes | every node replays the whole topic → **everyone** gets every event (broadcast) | the N nodes form **one** group, Kafka splits partitions → each message handled **once** (work-sharing) |

The liveness view is ephemeral per-node state you want fully rebuilt on every boot,
so it uses a throwaway group id and reads from `earliest` each time. The history
projection is durable shared state you want to **resume**, not rebuild, so it uses
a fixed group id and commits offsets — on restart it picks up where it left off
instead of re-`LPUSH`ing the whole topic. Same primitive (a consumer group), the
two ways a consumer group can be used, side by side in one service.

Co-partitioning makes the ordering free: `chat.messages.v1` is keyed by
`channelId`, so every message for a channel lands on one partition, owned by one
consumer instance. `LPUSH` order for a given `chat:history:{channelId}` key
therefore matches log order exactly, with no cross-node interleaving to reconcile.

## What is stored

Each item is the full server-authored record as JSON —
`{ messageId, userId, sentAt, body }` — not just `body`, even though today's
client wire is a raw body string (ADR-0018). Those fields are already in the Kafka
record and cost nothing to keep, and storing them now avoids a full re-projection
when a later phase puts real authors on the wire. `LPUSH` writes newest-first;
backfill (`chat-multi-node/04`) reverses the list to replay oldest-first.

## Consequences

- **History is at-most-once on a crash, by choice.** Offsets auto-commit on a timer
  independent of the `LPUSH`. If a node dies between a commit and the next write,
  that message is missing from the ring buffer — though never from
  `chat.messages.v1`, which can rebuild it. Backfill is best-effort and the wire
  has no dedup (ADR-0018 accepts a small dup/gap), so this is acceptable; the
  upgrade path, if exactly-once history ever matters, is manual commit after a
  successful `LPUSH` (at-least-once, deduped downstream).

- **The read model lags the log.** A projection built by consuming is always a
  little behind the produce. A message can be durable in Kafka and live on the
  fan-out plane a beat before it enters the ring buffer. Irrelevant for backfill,
  which only serves history to *newly* connecting viewers.

- **Rebuildable, at the cost of a re-read.** Wiping the Redis key or rotating the
  group id re-projects the channel from the start of the log. That is a feature —
  it is what makes the ring buffer disposable derived storage rather than a second
  source of truth — but a full re-projection re-reads the topic.

- **The window is a fixed count, not a time span.** `LTRIM` keeps the last 50
  messages regardless of how old they are: a slow channel keeps hours of history,
  a busy one keeps seconds. A time-bounded window would need a different structure;
  a count is the cheap, self-bounding choice for "show me something on join."

- **Redis holds derived state now, not only courier traffic.** The fan-out plane
  (ADR-0024) never retains anything; this key does. Both are disposable — the key
  is rebuildable from the log — but Redis is now storing a read model, not just
  relaying messages.
