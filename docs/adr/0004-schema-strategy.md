# Schema strategy: Avro, Apicurio, monorepo, BACKWARD, TopicNameStrategy

All Kafka event payloads are Avro-encoded. Schemas live as `.avsc` files in `packages/schemas/` inside the monorepo and are the human-readable source; each service runs language-specific Avro codegen at build time. Apicurio Registry (Apache-2.0, Confluent-compatible protocol) runs alongside Kafka and enforces compatibility — CI publishes schemas to it and fails on break. Compatibility mode is `BACKWARD`; subject naming is `TopicNameStrategy` (one event type per topic).

## Considered options

- **Protobuf instead of Avro.** Defensible — better IDE tooling and familiar to anyone with gRPC experience — but rejected because Avro is Schema Registry's native format; the reader/writer schema resolution and compatibility rules feel natural with Avro and awkward with Protobuf. Avro is also part of what we're here to learn.
- **JSON Schema.** Rejected: squishy evolution, larger wire size, no real cross-language type safety. Defeats the purpose of having a registry.
- **Confluent Schema Registry CE** instead of Apicurio. Rejected on licensing grounds (Confluent Community License has restrictive terms); Apicurio is fully Apache-2.0 and protocol-compatible.
- **Schemas per-service repo or registry-as-SoT.** Rejected: per-service makes shared events painful; registry-as-SoT gives the worst dev UX (IDE knows nothing until fetch). Monorepo `.avsc` files give compile-time safety plus PR-reviewable contract changes.
- **`FORWARD` or `FULL` compatibility.** Rejected for `BACKWARD` — matches the most natural deploy order (producers add fields → consumers upgrade later) and is the conventional choice in production Kafka deployments.
- **`RecordNameStrategy` / `TopicRecordNameStrategy` for multi-event topics.** Rejected: forces every event's lifecycle (retention, partitioning, consumers) to be designed independently, which is the right discipline at this scale.

## Consequences

- Every service's build pipeline includes an Avro codegen step targeting its language.
- Adding or changing an event requires a PR that touches `packages/schemas/`, making contract changes loud and reviewable.
- Compatibility breaks fail in CI rather than at runtime in production.
- Each Kafka topic carries exactly one event type — multi-event topics are explicitly out of scope.
