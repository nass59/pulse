# concurrent viewers is a hopping-window approximation, not a running ledger

`analytics` computes "concurrent viewers per stream" by folding the presence
streams (`chat.presence.joined.v1`, `chat.presence.left.v1`) into a **hopping
window** keyed by `streamId`: window size `W` (the _presence horizon_, MVP
`60s`), advancing every `10s`, with a `+1` per join and `−1` per leave. The
count read for "now" is the **freshest fully-elapsed window** — the one whose
end is nearest to now — _not_ the most-recently-_started_ window, which has
barely accumulated any of the horizon yet (see Consequences → _Reading "now"_).
A join contributes for `W` after it
lands and then **ages out**; the count is therefore "sessions that joined within
the last `W` and have not since left" — deliberately approximate. This records
why we did _not_ keep an exact running count.

## Why this needs stating

The obvious implementation of "currently connected" is a non-windowed `KTable`
keyed by `streamId` holding a running `+1/−1` balance forever. It is simpler to
write, it is exact when the input is perfect, and a future reader _will_ reach
for it and ask why we didn't. The reason is the failure mode, not the happy path.

Presence is **server-authored but not transactional** (CONTEXT.md, `chat`
entry): a `ViewerLeft` can simply be lost — a gateway node that dies without
flushing leaves a join with no matching leave. A permanent running balance has
**no mechanism to forget** that orphaned `+1`; the stream's count is wrong, high,
until the process restarts and replays. With thousands of sessions and ordinary
node churn, the error accumulates monotonically. The count that is "exact" on
paper is the one that drifts furthest in practice.

A bounded window is the fix: an orphaned join falls out of the trailing horizon
on its own, so a lost leave **self-heals** within `W` instead of poisoning the
count indefinitely. This is the same "push crash-consistency downstream"
posture the rest of Pulse takes — we accept an approximate number we can always
recompute over an exact number we have to defend against every failure mode.

## Considered options

- **Non-windowed `KTable`, running `+1/−1` balance (rejected).** Exact under
  perfect input; inflates forever on any lost `ViewerLeft`, with no ageing to
  recover. This is the "balanced ledger" the CONTEXT.md _Viewer session_ entry
  explicitly warns against. Reconciling or synthesising leaves for dangling
  sessions to keep it exact is exactly the work the windowed design exists to
  avoid.

- **Tumbling window, `+1/−1` (rejected).** A tumbling window resets to `0` at
  each boundary, so it has no memory of a viewer who joined in a prior bucket and
  is still watching — it measures join/leave _churn in the bucket_, not
  occupancy, and reports `0` for a stable audience. It cannot express "age out
  after `W`" because its horizon is one bucket, not a trailing span.

- **Hopping window, horizon `W`, advance `A` (chosen).** Overlapping windows give
  a trailing-horizon count: a join is live for `W`, a real leave removes it
  early, a lost leave ages out at `W`, and the advance `A` sets how often the
  number refreshes. The honest minimum that delivers the approximate, self-healing
  contract — and the richer windowing lesson (overlap, window retention, grace).

- **Heartbeat-driven presence (deferred to Phase 2).** The production answer to
  "count a viewer who has watched for an hour": `chat` re-asserts each open
  session periodically, and `analytics` counts sessions seen in the last
  heartbeat interval. This removes the long-session undercount below. Out of scope
  for the MVP, which has no heartbeat — recorded here as the upgrade path.

## Consequences

- **The number has a precise, narrow meaning:** "sessions that joined within the
  last `W` and have not since left." It is not "everyone currently watching."
  Consumers (the dashboard, issue 04's query API) must treat it as an
  approximation, never a ledger.

- **Long sessions are undercounted.** With no heartbeat, a join with no leave
  ages out at `W` even though the viewer is still there. `W` is the dial: larger
  `W` counts long sessions better but tracks real departures more slowly (a leave
  still shows for the remainder of the windows it falls in). `60s` is an MVP
  guess, not a tuned value.

- **Re-keying cost.** Presence is keyed by `channelId` (ADR-0012); aggregating by
  `streamId` triggers an internal repartition topic, and every producer plus the
  repartition must hash keys with murmur2 (ADR-0014) or co-partitioning breaks.

- **Reading "now" is not `store.get(key)`.** `viewers-per-stream` is a windowed
  store: at any instant ~`W/advance` (≈6) windows are live per `streamId`, and
  they hold **different** counts, because each window only sums the deltas whose
  event-time falls inside its own span. The most-recently-_started_ window
  contains almost none of the horizon (for a stable audience it reads ≈`0`); the
  window whose _end_ is nearest to now carries the full trailing `W`. So the
  query (issue 04) must `fetch(streamId, now−2W, now)` and select the window with
  the greatest `windowStart` where `windowStart + W ≤ now` — the freshest
  fully-elapsed window. This is at most `advance` (10s) stale, which is the
  refresh cadence by design. The alternative (oldest still-open window) is a few
  seconds fresher but covers only `W−advance` of history and under-counts the
  oldest arrivals.

- **The selected window needs a freshness cutoff.** Empty windows are never
  materialized, so when a stream goes **silent** no newer window supersedes the
  last populated one — it lingers in the `now−2W` fetch range and the naive
  "freshest fully-elapsed window" read reports stale-high for up to ~`2W` (proven
  live: three joins then silence held the count at `3` for ≈`2W`, not `W`). Since
  the count means "joined within the last `W`," a window whose _end_ is far from
  now describes an older horizon and is not "now." The query therefore returns
  `0` unless the selected window ended within `advance + grace` of now. This puts
  the silent-stream age-out at ≈`W + advance + grace` (honoring the horizon)
  rather than ≈`2W`, and — with no heartbeat — is the same mechanism that makes a
  session watched longer than `W` undercount to `0` (the documented MVP limit).
  For a continuously-active stream every advance yields a fresh populated window,
  so the cutoff never fires spuriously.

- **Absence is `0`, not "not found."** `analytics` consumes only the presence
  topics, never `stream.started.v1` / `stream.ended.v1`, so it has no registry
  of valid `streamId`s. An empty store read cannot be told apart across three
  cases — unknown id, live-but-empty stream, everyone aged out — so the query
  API (issue 04) returns `200 { count: 0 }` for all of them rather than a `404`
  that would dress "no data" up as "does not exist." A typo'd id therefore reads
  as `0`; that is the honest limit of a presence-only view.

- **The window is the mechanism, not a shortcut.** Earlier framing treated the
  windowed count as an MVP compromise on the way to a "real" continuous KTable.
  That is inverted: the continuous KTable is the design we reject, and the window
  is the destination. The Phase-2 upgrade is heartbeats, not de-windowing.
