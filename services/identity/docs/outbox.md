# The transactional outbox

## Why this exists

A handler that does `db.insert()` then `kafka.publish()` has a dual-write bug:
a crash between the two leaves Postgres updated with no event published (other
services never learn the channel went live), or — if you publish first — an
event published for a state change that then failed to commit. There is no
ordering of two separate systems that is crash-safe.

## How we close the gap

The event is written as a row in the `outbox` table **inside the same Postgres
transaction** as the business write (`writeEvent(tx, ...)`). State change and
"intent to publish" commit atomically — one transaction, one outcome.

A separate relay (see issue 04) reads unpublished outbox rows and produces them
to Kafka, marking each published. The relay gives **at-least-once** delivery: a
crash after the Kafka ack but before the `published_at` update means the row is
republished on restart. Therefore **consumers must be idempotent** — that is a
property of the system, not a bug to fix on the producer side.

## The one rule

`writeEvent` takes a `TransactionSql`, never a pool. Encoding to Kafka happens
only in the relay. Never `kafka.publish()` from a request handler — that
reintroduces the dual-write bug and defeats the entire pattern.

## Aggregate identity is not the partition key

An outbox row carries both `aggregate_id` and `partition_key`, and for stream
lifecycle events they are deliberately _different_:

- `aggregate_type` / `aggregate_id` describe **what changed in the database** —
  the stream whose lifecycle moved (`"stream"` / `streamId`). It's the durable,
  Debezium-shaped identity of the entity that produced the event.
- `partition_key` describes **how Kafka orders the event** — `channelId`, so a
  channel's events share a partition (ADR-0012's co-partitioning).

Conflating them is a common outbox mistake. The DB's notion of "the aggregate"
and the log's notion of "the ordering key" answer different questions.
