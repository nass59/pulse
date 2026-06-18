# WebSocket fan-out is best-effort; the Kafka log is the durable record

`chat` fans a message out to a channel's other viewers by dropping it into each
connection's buffered `send` channel (the per-connection outbox, capacity 16). The
broadcast does this with a **non-blocking** send:

```go
select {
case c.send <- msg: // queued in their outbox
default:            // outbox FULL = slow client -> drop this viewer's copy
}
```

So a viewer who can't keep up **silently loses frames** off the live socket. This
is deliberate. The WebSocket fan-out is **best-effort live delivery, not
guaranteed delivery**: durability does not live in the socket, it lives in the
**`chat.messages.v1` log** (the canonical message log, ADR-0012). Once a message
is produced to the log (issue 03), a dropped live frame is a *missed real-time
push*, not a *lost message* — a client backfills the gap from history. The socket
is the fast path; the log is the truth.

## Why this needs stating

A reader who meets `default: // drop` without this context reads it as silent data
loss and "fixes" it — into one of the three options below, each of which is worse.

## Considered options

- **Block (omit `default:`).** A plain `c.send <- msg` blocks the broadcaster
  until that one viewer's outbox drains — so a single slow client freezes the
  message flow for *everyone* in the room. Rejected: one bad network stalls the
  whole channel.
- **Disconnect the slow viewer.** Kick the socket when its outbox fills and let
  the client reconnect. Rejected as the default policy: aggressive, and invites
  reconnect storms on transient slowness; a brief stall shouldn't cost the session.
- **Unbounded buffer.** Queue everything for every viewer. Rejected: a slow or
  malicious client grows its outbox without bound — memory blow-up / OOM under the
  thousands-of-connections load `chat` is built for.
- **Drop (chosen).** Bounded outbox + non-blocking send. One slow client loses
  *its own* frames; the room stays live and memory stays bounded. The loss is
  acceptable precisely because the log, not the socket, is the durable record.

## Consequences

- **MVP status:** as of issue 03 the produce path is live, so a dropped live frame
  is now **durably recorded in `chat.messages.v1`** — the message itself is no
  longer lost, only its real-time push to that one viewer was missed. What is still
  unbuilt is the **client backfill path** (the Redis ring buffer for mid-stream
  join, Phase 2): until that lands, a viewer who drops a frame has no way to
  *recover* it, even though the log holds it. So the socket's best-effort role is
  now **safe at the log** but **not yet recoverable end-to-end** — closing that gap
  is Phase 2, not a change to this decision.
- The outbox capacity (`16`) is the tuning knob between "absorb brief slowness"
  and "drop sooner to bound memory." It is a per-connection cost, so it scales
  with concurrent viewers.
- This stance is orthogonal to ordering and exactly-once concerns on the *produce*
  side (ADR-0014): those govern the log; this governs the live fan-out reading
  *from* the same messages.
