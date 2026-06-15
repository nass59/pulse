/**
 * Provisions every Kafka topic declared in TOPIC_CONFIGS with its contracted
 * partition count and retention — the executable source of truth ADR-0012 calls
 * for, parallel to publish.ts (which does the same for the schema registry).
 *
 * Run: `bun packages/schemas/scripts/provision-topics.ts` (or `just infra-topics`).
 *
 * Idempotent: missing topics are created; topics that already exist at the
 * right partition count are skipped. A topic that exists at the *wrong*
 * partition count is reported loudly and the script exits non-zero — adding
 * partitions to a keyed topic rehashes its keys, so that is a migration
 * (delete + recreate + republish), never a silent config edit (ADR-0012).
 *
 * Scope boundary: this enforces partition count only — the irreversible half
 * of the contract. Retention / cleanup.policy drift on an *existing* topic is
 * deliberately not reconciled here: those are cheap, reversible `alterConfigs`
 * edits, not migrations, so an existing topic keeps whatever retention it has.
 * They are applied only at creation time (see `configEntries` below).
 */

import { Kafka } from "kafkajs";
import { TOPIC_CONFIGS } from "../topics";

const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",");
const kafka = new Kafka({ clientId: "topic-provisioner", brokers });
const admin = kafka.admin();

/** Single-broker dev cluster — every topic is RF 1 (ADR-0015). */
const REPLICATION_FACTOR = 1;

const provision = async () => {
  await admin.connect();

  try {
    const existing = new Set(await admin.listTopics());
    const declared = Object.entries(TOPIC_CONFIGS);

    const toCreate = declared.filter(([topic]) => !existing.has(topic));
    const present = declared.filter(([topic]) => existing.has(topic));

    /**
     * For topics that already exist, verify the live partition count matches
     * the contract before treating the run as a no-op. This is the drift the
     * whole issue exists to kill: a topic auto-created at 1 partition looks
     * ordered in dev but silently breaks per-channel ordering once grown.
     */
    if (present.length > 0) {
      const meta = await admin.fetchTopicMetadata({
        topics: present.map(([topic]) => topic),
      });

      const livePartitions = new Map(
        meta.topics.map((t) => [t.name, t.partitions.length])
      );

      const drifted = present.filter(
        ([topic, cfg]) => livePartitions.get(topic) !== cfg.partitions
      );

      if (drifted.length > 0) {
        for (const [topic, cfg] of drifted) {
          console.error(
            `✗ ${topic}: live partitions=${livePartitions.get(topic)}, contract=${cfg.partitions}. ` +
              "Delete and recreate it — changing a keyed topic's partition count is a migration, not a config edit (ADR-0012)."
          );
        }

        process.exitCode = 1;

        return;
      }

      for (const [topic, cfg] of present) {
        console.log(
          `• ${topic} already provisioned (${cfg.partitions} partitions) — skipped`
        );
      }
    }

    if (toCreate.length > 0) {
      await admin.createTopics({
        waitForLeaders: true,
        topics: toCreate.map(([topic, cfg]) => ({
          topic,
          numPartitions: cfg.partitions,
          replicationFactor: REPLICATION_FACTOR,
          configEntries: [
            { name: "cleanup.policy", value: cfg.cleanupPolicy },
            { name: "retention.ms", value: String(cfg.retentionMs) },
          ],
        })),
      });

      for (const [topic, cfg] of toCreate) {
        console.log(
          `✓ ${topic} created — ${cfg.partitions} partitions, cleanup.policy=${cfg.cleanupPolicy}, retention.ms=${cfg.retentionMs}`
        );
      }
    }

    console.log(
      `\nProvisioning complete: ${toCreate.length} created, ${present.length} already present.`
    );
  } finally {
    await admin.disconnect();
  }
};

await provision();
