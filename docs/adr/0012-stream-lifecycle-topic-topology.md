# Stream lifecycle topic topology: channelId-keyed, 6 partitions, 7-day delete

`identity` produces `stream.started.v1` and `stream.ended.v1`. Both are keyed by
`channelId`, given 7-day delete retention (uncompacted), and provisioned
explicitly with **6 partitions** — a count shared by every `channelId`-keyed
topic across the system. The schema's registration (ADR-0004) does not configure
the topic; this records the topic configuration itself, which `CONTEXT.md` left
deliberately open until `identity` was built.

## Considered options

- **Key by `streamId` instead of `channelId`.** Rejected. Keying by `streamId`
  still gives per-stream ordering (a stream's `Started`/`Ended` share an id), so
  ordering alone doesn't decide it. The tiebreaker is **co-partitioning**: the
  chat topics are keyed by `channelId`, so keying lifecycle by `channelId` puts a
  channel's stream-state and its chat on the same partition number — the
  precondition for joining a stream-state table against the chat stream in
  `analytics` without a repartition. `streamId` would force a repartition for
  those joins.
- **Compacted retention.** Rejected, and it would be a correctness bug.
  Compaction keeps only the latest value per key; keyed by `channelId`, that
  would erase the history of every prior stream for a channel. Lifecycle events
  are immutable _facts_, not a current-state _snapshot_ — delete-retained, not
  compacted. (Contrast `chat.redactions.v1`, where latest-per-key is the intent.)
- **Infinite retention (event-sourced history).** Rejected _for `identity`_:
  Postgres is canonical and already holds the durable `streams` history with
  `started_at`/`ended_at`, so a permanent log duplicating it earns nothing. The
  log is a notification stream, not the source of truth.
- **Auto-create on first produce.** Rejected. Auto-created topics inherit broker
  defaults (typically 1 partition, default retention) — none of the config above
  — and race on first produce. Explicit provisioning (an `infra/` step, parallel
  to `packages/schemas/publish.ts`) is the executable source of truth for topic
  config; the broker's `auto.create.topics.enable` should ultimately be `false`
  so a missing topic fails loudly.
- **1 partition for the MVP.** Rejected in favour of committing to the real count
  now. Partition count is effectively irreversible for a keyed topic — adding
  partitions rehashes keys to different partitions, destroying both per-channel
  ordering and co-partitioning. Starting at 1 would mean recreating every
  `channelId`-keyed topic at the real count in Phase 2.

## Consequences

- Partition count is a **system-wide constraint**, not a per-topic choice: every
  `channelId`-keyed topic (lifecycle now, chat in Phase 2) must share the same
  count, sized for the highest-throughput member (chat). We commit to **6**.
- Co-partitioning also requires every producer to hash keys identically across
  languages — see [ADR-0014](0014-murmur2-partitioning-across-producers.md).
- Topics must be provisioned by an explicit infra step before producers run;
  the relay no longer relies on auto-create.
- Changing the key or the partition count later is a topic migration, not a
  config edit — by design, this is the irreversibility the choice buys ordering
  and join-ability with.
