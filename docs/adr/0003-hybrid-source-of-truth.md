# Hybrid source of truth per bounded context

Each bounded context picks its own source-of-truth model based on data shape, rather than committing the whole system to one ideology. `identity` uses Postgres as canonical with the transactional outbox pattern emitting events to Kafka. `chat` uses the Kafka log itself as canonical, with redactions as additive events on a compacted side topic and reads served from projections (Redis ring buffer, S3 archives). `analytics` has no original state — its Kafka Streams state stores are materialised views that can be rebuilt by replay.

## Considered options

- **Pure event sourcing across all services.** Rejected: intellectually attractive but a known footgun. Relational domains like users-and-follows fight the log model; schema mistakes become permanent; debugging "why is this row wrong" is much harder than in Postgres. Most teams that try this regret it within a year.
- **DB-as-SoT everywhere, Kafka as pure notification bus.** Rejected: Kafka becomes an expensive RabbitMQ. The pedagogical value of "log as source of truth" (offset-based consumption, replay, time-travel) is lost. Chat in particular is naturally log-shaped — storing it in Postgres *and* Kafka is waste.
- **Hybrid (chosen).** Each context picks the model that fits. The three contexts happen to map cleanly to the three canonical patterns: outbox (`identity`), log-as-truth (`chat`), pure-derived (`analytics`).

## Consequences

- Three distinct persistence patterns to learn and operate — but learning all three is precisely the goal.
- Reads in `chat` always go through a projection, never raw Kafka — viewers don't consume Kafka directly. The Redis ring buffer is a *read cache*, not a second source of truth.
- "Restore from backup" means different things per service: Postgres dump for `identity`; Kafka topic retention + S3 archives for `chat`; replay-from-zero for `analytics`.
