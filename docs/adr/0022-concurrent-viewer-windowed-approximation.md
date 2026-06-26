# concurrent viewers is a hopping-window approximation, not a running ledger

`analytics` computes "concurrent viewers per stream" by folding the presence
streams (`chat.presence.joined.v1`, `chat.presence.left.v1`) into a **hopping
window** keyed by `streamId`: window size `W` (the _presence horizon_, MVP
`60s`), advancing every `10s`, with a `+1` per join and `−1` per leave. The
count read for "now" is the latest window. A join contributes for `W` after it
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

- **The window is the mechanism, not a shortcut.** Earlier framing treated the
  windowed count as an MVP compromise on the way to a "real" continuous KTable.
  That is inverted: the continuous KTable is the design we reject, and the window
  is the destination. The Phase-2 upgrade is heartbeats, not de-windowing.
