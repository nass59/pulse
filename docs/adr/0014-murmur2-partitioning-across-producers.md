# All producers use Java-compatible (murmur2) partitioning

Every Kafka producer across the polyglot stack must hash partition keys with
**murmur2** (the Java client's algorithm), so the same key lands on the same
partition regardless of which language produced it. This is the cross-language
rule that makes the co-partitioning in ADR-0012 actually hold — without it,
keying by `channelId` co-partitions nothing.

## Why this needs stating

Partitioner defaults disagree across clients:

- **kafkajs v2 default** — murmur2 (Java-compatible). ✓ Keep it; never switch to
  `LegacyPartitioner` (the v2 migration warning tempts exactly this, and it would
  silently break cross-language partitioning).
- **Java / Kotlin** (`analytics`) — murmur2 by default. ✓
- **librdkafka** (`confluent-kafka-go`, the likely `chat` client) — defaults to
  `consistent_random`, a **CRC32** hash, _not_ murmur2. ✗ Must be explicitly set
  to `partitioner=murmur2_random`.

So `identity` (kafkajs) and a default-configured Go `chat` producer would hash
the same `channelId` to different partitions, and `analytics` could not join
stream-state against the chat stream without a repartition — defeating the whole
reason ADR-0012 keys by `channelId`.

## Consequences

- The Go `chat` producer (Phase 1+) must set `partitioner=murmur2_random`.
- Changing a live topic's effective partitioner re-routes every key — a topic
  migration, not a config edit. Pin murmur2 from day one.
- If `identity` later swaps kafkajs for `@confluentinc/kafka-javascript`
  (librdkafka-backed), it inherits librdkafka's CRC32 default and must apply the
  same `murmur2_random` setting.
