# redis pub/sub is the cross-node fan-out plane; kafka stays the record

A chat message that arrives on one `chat` gateway node reaches viewers on every
other node through **Redis pub/sub**, not through Kafka. On an inbound WebSocket
message the gateway does two things and only two things: it produces
`ChatMessageSent` to `chat.messages.v1` (unchanged, ADR-0018), and it `PUBLISH`es
an envelope to the Redis channel `chat:fanout:{channelId}`. Every node subscribes
to the channels it has live viewers on and fans the body out to *its own* local
sockets.

Crucially, **the inbound handler no longer broadcasts locally**. Fan-out happens
in exactly one place — the Redis subscriber — on every node, including the node
that received the message.

This replaces the in-process `map[channelId][]*conn` fan-out of chat-mvp/04,
which was invisible to a second node: two gateways meant two disjoint rooms on
the same channel.

## Two planes, two jobs

Redis pub/sub is at-most-once, has no retention, no replay, and no
acknowledgement. A node that is down when a message is published never learns the
message existed, and nothing will ever tell it.

Those are disqualifying properties for a **record** and ideal properties for a
**courier**. The durable copy is already safe in `chat.messages.v1` before the
publish happens, and a viewer who was not connected did not need the live frame
anyway — they will get history from the projection instead (`chat-multi-node/03`).
So the division of labour is explicit:

- **Kafka is the truth.** Durable, ordered per channel, replayable, retained.
  Everything derived — history, archives, analytics — is built from it.
- **Redis is the courier.** It answers exactly one question: *"who is connected
  right now, and how do I reach them this instant?"* It is never read back, never
  replayed, and nothing is ever derived from it.

The rule that follows, and the one to hold on to: **anything derived from the log
survives a node restart; anything that only ever lived in a process or on the
pub/sub wire does not — and must never be the only copy.**

## Why not fan out over Kafka itself?

Every node could subscribe to `chat.messages.v1` with a unique consumer group and
fan out from there — one system instead of two, and no new infrastructure.
Rejected: it puts a durable, ordered, disk-backed log on the *latency* path of a
keystroke, and it makes the live plane inherit consumer-group semantics
(rebalances, offset management, partition assignment) for a job that wants none of
them. Kafka's guarantees are exactly what makes it the wrong courier. The two
planes have opposite requirements, so they get different systems.

## The one code path

The tempting implementation is "broadcast to my local sockets **and** publish so
the other nodes can too." Rejected, because it creates two fan-out call sites and
forces the origin node to recognise and suppress its own message when it loops
back from Redis (dedup by node id).

The chosen path is uniform: **publish everything, fan out only from the
subscription.** The origin node's viewers receive the message through the same
door as every other node's. No loopback bookkeeping, no origin-node special case,
one place where a message becomes a frame on a socket.

## The envelope: the internal format is not the wire format

Once fan-out is driven by pub/sub, the subscriber no longer knows *which socket*
sent the message, so the old "don't echo to the sender" check has nothing to
compare against. The Redis payload therefore carries more than the client wire
does:

| plane                 | payload                                     |
| --------------------- | ------------------------------------------- |
| client WebSocket wire | `"hello"` — a raw body string (ADR-0018)    |
| Redis fan-out         | `{"senderId": "<conn-uuid>", "body": "hello"}` |

`senderId` is a per-connection id minted by the origin node. Only the origin node
holds a socket with that id, so only it skips one; every other node finds no match
and fans out to all of its viewers. One rule, no branches — and a deliberate
statement that the **internal fan-out format is free to evolve independently of
the external client contract**.

## Keying and subscription lifecycle

The Redis channel is keyed by `channelId`, the canonical id everything in Pulse
co-partitions on — not by slug, which is a URL affordance. The gateway's local
connection registry was rekeyed from slug to `channelId` to match, so one
identifier runs from the Kafka message key through the Redis channel name to the
in-memory registry.

A node subscribes to a channel's fan-out on the **first** local viewer and
unsubscribes on the **last**. The connection registry is the reference count — no
separate bookkeeping — so a node only carries fan-out traffic for channels it can
actually deliver to.

## Consequences

- **A live message can be lost, and that is accepted.** If Redis drops a publish,
  or a node's subscription is momentarily down, the connected viewers on that node
  simply never see that frame. `chat.messages.v1` still has it. Chat is a live
  medium: a message nobody saw in the moment is not worth a delivery guarantee, and
  buying one here would mean rebuilding Kafka inside the live plane.

- **Redis is now a hard runtime dependency of `chat`.** The gateway starts with a
  Redis connection or exits. Redis down means no cross-node fan-out at all — not
  degraded delivery, none. This is a single point of failure on the live plane and
  is knowingly unaddressed at this scale.

- **The delivery path grew a hop.** Produce → publish → subscribe → socket, where
  it used to be produce → socket. The sender's own client hides this: it echoes
  optimistically (chat-mvp/04), so the Redis round-trip is invisible to the person
  typing.

- **Ordering across nodes is not guaranteed.** Two messages published from two
  different nodes may reach a third node in either order. Per-channel order is
  preserved in Kafka (single partition per `channelId`), so the *record* is
  ordered; the live view may briefly disagree. Not worth solving for chat.

- **Nothing may be derived from the pub/sub stream.** History, archives, and
  analytics are all built by consuming `chat.messages.v1`. If a future feature is
  tempted to build state off the fan-out channel, that is the smell that it should
  be a Kafka consumer instead — the ring buffer in `chat-multi-node/03` is the
  first test of this rule, and it is built off the log.

- **Presence is unaffected.** `ViewerJoined` / `ViewerLeft` already flow through
  Kafka and are aggregated by `analytics`; multi-node changed nothing there.
