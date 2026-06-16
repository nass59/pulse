# Stream lifecycle events carry `channelSlug` for consumer-side address resolution

`stream.started.v1` and `stream.ended.v1` carry the channel's **`channelSlug`**
in their payload, alongside the `channelId` they are already keyed by. `chat`
accepts viewer WebSocket connections by slug (`/ws/{channelSlug}`) but tracks
liveness and produces every event by `channelId`; carrying the slug in the
lifecycle event lets `chat` build its `slug → channelId` mapping purely from the
log, with no synchronous call back to `identity`.

## Context

The slug (a channel's stable, human-readable public address, e.g.
`alices-channel`) and the `channelId` (a uuid, the internal partitioning/join
key) are distinct identifiers, and only `identity`'s Postgres holds the mapping
between them. `chat` is handed a slug at the door but must key everything by
`channelId`. Something has to resolve one to the other.

## Considered options

- **Carry the slug in the lifecycle events (chosen).** `chat` learns the mapping
  from the same stream it already consumes for liveness. Its *only* dependency on
  `identity` stays "the event log" — the exact philosophy the
  consume-stream-lifecycle work teaches (don't *ask* identity, *learn* from the
  log). The cost is that the slug becomes part of the event contract and is
  denormalized into every lifecycle event.
- **Synchronous HTTP lookup `chat → identity`.** Rejected. It re-introduces a
  request-path coupling between the two services for what is, ironically, the
  liveness concern we deliberately made event-derived. A slow or down `identity`
  would then slow or fail WebSocket connection setup.
- **Connect by `channelId` (uuid) at the gateway.** Rejected. It leaks an
  internal identifier into the public URL and pushes slug→id resolution onto the
  frontend, which would itself then need to query `identity`.

## Consequences

- The slug is **denormalized channel reference data** riding along with the
  lifecycle fact. This is deliberate: an event should carry the context its
  consumer needs, and the channel's slug is stable, so duplicating it into each
  `StreamStarted` costs nothing in correctness.
- `identity` must populate `channelSlug` when it emits the events (it already
  resolves `slug → channel.id` in its go-live / end-stream handlers, so the value
  is in hand). This is a follow-up change to `identity`.
- `channelSlug` is a **required field with no default**. Adding a field under
  `BACKWARD` compatibility (ADR-0004) would normally require a default so the
  registry accepts the new schema against retained records — but a slug is never
  legitimately empty, and a default would bake that fiction into the contract
  permanently. Because this happens **pre-launch** (no `chat` consumer exists and
  no retained data on the topics is precious), we instead **reset**: delete the
  subjects, recreate the topics, and register the schema fresh with `channelSlug`
  required. This is legitimate only at this moment — once `chat` consumes
  `stream.started.v1`, the same change becomes a real migration. Same instinct as
  ADR-0012's "commit to the real partition count now."
- `chat`'s live-map is keyed by `channelId` (the producer reads `streamId` out of
  it); a secondary `slug → channelId` index is maintained from the same events so
  the WebSocket handler can resolve the incoming slug.
