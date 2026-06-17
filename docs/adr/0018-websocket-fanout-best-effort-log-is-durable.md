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

- **MVP caveat (today):** there is no Kafka produce and no history replay yet, so
  a dropped frame is genuinely gone for that viewer. The guarantee is
  **best-effort now, recoverable-from-log once issue 03 lands** — at which point
  the socket's best-effort role becomes safe rather than lossy.
- The outbox capacity (`16`) is the tuning knob between "absorb brief slowness"
  and "drop sooner to bound memory." It is a per-connection cost, so it scales
  with concurrent viewers.
- This stance is orthogonal to ordering and exactly-once concerns on the *produce*
  side (ADR-0014): those govern the log; this governs the live fan-out reading
  *from* the same messages.
