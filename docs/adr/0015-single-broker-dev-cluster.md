# Single-broker dev cluster: internal-topic replication pinned to 1, log persisted via volume

Pulse's `infra/docker-compose.yaml` runs **one** Kafka broker (KRaft, `KAFKA_NODE_ID: 1`, a single quorum voter). Kafka's broker-internal topics default their replication factor to **3**, which a one-broker cluster can never satisfy: the coordinator silently fails to create the topic and its clients hang. We therefore pin every internal replication factor to 1 and back the broker's log with a named volume so the cluster survives a container recreate.

```yaml
KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
KAFKA_LOG_DIRS: /var/lib/kafka/data   # + volume kafka_data:/var/lib/kafka/data
```

## Why this is non-obvious

The failure is invisible until you use a **coordinator**. Producing never needs one, so the outbox relay (ADR-0013) and `stage-event` worked from day one. The first consumer group (`scripts/consume.ts`) tried to create `__consumer_offsets`, couldn't place 3 replicas on 1 broker, and crashed with `KafkaJSGroupCoordinatorNotFound` — with nothing in the error pointing at replication factor. The two `transaction.state.log.*` settings pre-empt the identical failure on `__transaction_state`, which the *next* idempotent/transactional producer would otherwise hit. They look redundant today; they are deliberate.

## Considered options

- **Offsets replication factor only.** Rejected. Cluster shape is one coherent fact ("this is a single-broker cluster"), better stated once than rediscovered per coordinator. The transaction-log lines cost nothing and are the canonical single-broker preset.
- **No persistent volume (the original setup).** Rejected. Without a volume the broker writes to the container filesystem, so applying *any* broker config change — which requires a container recreate — wipes every topic, event, and committed offset. For a project whose loop is "stage events, then consume and eyeball them," losing history on every tweak is a real papercut. With the volume, wiping becomes an explicit `docker compose down -v`.
- **Keep the image default `log.dir=/tmp/kafka-logs` and mount there.** Rejected. `/tmp` is semantically throwaway and cleared by some hosts; we set an explicit `/var/lib/kafka/data` and mount the volume on that.

## Consequences

- `RF=1` means **no fault tolerance** for offsets or transaction state — acceptable in dev, and a latent bug if this compose is copied toward a multi-broker or production cluster. Any such move must raise these factors back to match the broker count.
- KRaft stores its cluster metadata in the same log dir, so the volume also stabilises the cluster id across recreates (no reformat-on-boot).
- This is orthogonal to ADR-0012's "explicit provisioning / `auto.create.topics.enable: false`" stance: `__consumer_offsets` and `__transaction_state` are broker-managed internal topics, not application topics, and are not governed by auto-create. The only lever is their replication factor.
