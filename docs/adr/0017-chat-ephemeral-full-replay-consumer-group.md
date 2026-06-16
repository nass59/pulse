# chat consumes stream-lifecycle via an ephemeral, full-replay consumer group

`chat` learns which channels are live by consuming `stream.started.v1` /
`stream.ended.v1` (ADR-0012) into an in-memory `liveChannels` map. It does so with
a consumer group id that is **unique per process start** —
`chat-gateway-${HOSTNAME}-${bootId}`, a fresh `bootId` each boot — with
**auto-commit disabled** and `auto.offset.reset=earliest`. Together these force
every instance, on every boot, to **replay the lifecycle topics from the
beginning** and rebuild the full map. This deliberately uses the consumer-group
API for the opposite of what it's designed for, so the reasoning is recorded here.

## Why this needs stating

A consumer group normally does two things: it **load-balances** partitions across
members, and it **commits offsets** so a restart resumes where it left off. `chat`
wants **neither**, and a reader who doesn't know that will "fix" this into a bug.

- **Every instance must see every partition.** Any viewer can connect to any
  channel, so each node needs the *complete* live-channel picture — a broadcast
  read, not a load-balanced split. A shared group would partition the lifecycle
  topics across nodes, and each node would reject viewers for channels whose
  `StreamStarted` landed on a partition it wasn't assigned.
- **Every boot must rebuild from offset zero.** The map is in-memory and
  ephemeral; on restart it must be reconstructed from the whole log.

## Considered options

- **Stable per-host group, `chat-gateway-${HOSTNAME}` (no `bootId`).** Rejected —
  this is the subtle trap. `auto.offset.reset=earliest` only applies when the
  group has **no committed offset**. A group id that survives a container restart
  would, on its *second* boot, resume from the last committed offset and replay
  only recent events — rebuilding an **incomplete** map and silently rejecting
  viewers for channels that went live before the last commit. The id must be new
  every process start, and there is nothing worth committing, so auto-commit is
  off.
- **Shared group across instances, `chat-gateway` (no host suffix).** Rejected —
  load-balances the partitions across nodes (see above), the exact opposite of the
  broadcast semantics required.
- **Skip groups entirely: manual `Assign()` all partitions + `SeekToBeginning()`.**
  A cleaner expression of intent (it says "I want all partitions from the start"
  directly) and a legitimate alternative. Rejected **on pedagogical grounds only**:
  Pulse is a learning vehicle and this is the first cross-service consumer, so we
  keep the consumer-group API and make it correct — meeting consumer groups,
  offsets, and `auto.offset.reset` firsthand is the lesson. The manual-assign form
  is the right call for a non-teaching codebase.

## Consequences

- Full-topic replay on every boot is **O(topic size)**. Fine while lifecycle
  topics are small (7-day delete retention, ADR-0012); it becomes the bottleneck
  once a channel has years of go-lives.
- The production answer is a **compacted "current stream state per channel" topic**
  (latest-per-`channelId`), turning the full replay into a small snapshot read.
  Deferred to Phase 2 (`chat-multi-node`) — this ADR is the thing that motivates it.
- This consuming pattern is orthogonal to ADR-0012, which records the *topic*
  topology (keying, retention, partition count); ADR-0017 records how `chat`
  *reads* those topics. The eventual-consistency window the gate inherits is
  documented in `CONTEXT.md` (the `chat` bounded-context entry).
