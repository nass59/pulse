# In-process polling outbox relay, locks held across publish

`identity`'s outbox relay is a single polling loop running **inside the API
process**. Each iteration runs one transaction: `SELECT … FOR UPDATE SKIP
LOCKED` a batch of unpublished rows, `producer.send()` each to Kafka, `UPDATE …
published_at`, `COMMIT` — so it **holds the row locks across the Kafka network
round-trip**. This is a deliberate Phase-1 shape; Change-Data-Capture is
deferred to Phase 3 (`identity-follows`).

## Considered options

- **Claim / publish / mark in separate transactions** (T1 marks rows `claimed`
  and commits; publish happens outside any transaction; T2 marks `published`).
  Removes locks-held-during-I/O, but adds a `claimed` state, a crash window
  between claim and publish, and a reaper for stuck-claimed rows. That
  complexity only pays off with multiple concurrent relays — none exist yet.
  With a single loop, `SKIP LOCKED` contention is zero, so holding locks across
  the publish costs nothing.
- **Relay as a separate process.** Rejected for Phase 1: it pays multi-process
  operational cost to solve event-loop/pool contention that does not exist at
  this volume. One process, one deploy, one shared pool is the right amount of
  machinery while the pattern is being learned.
- **Debezium CDC (read the WAL) instead of polling.** The production-grade
  alternative — no polling lag, no relay process — but a large operational
  dependency. Explicitly deferred: `identity-follows` (Phase 3) revisits
  polling-vs-CDC as its own lesson, after the polling relay's limits (burst lag)
  have been felt firsthand.

## Consequences

- Delivery is **at-least-once**: a crash after the Kafka ack but before the
  `published_at` commit republishes the row on restart. Consumers must be
  idempotent — a system property, not a bug.
- The relay shares the API's lifecycle: it is started after the server listens
  and stopped *before* the DB pool closes on shutdown.
- The in-process, locks-during-publish shape is deliberate. Do not extract the
  relay or restructure the transaction before Phase 3 — the simpler shape is
  correct for a single loop, and the alternatives are the Phase 3 lesson.
