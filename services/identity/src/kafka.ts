import { Kafka } from "kafkajs";
import { config } from "./config";

/**
 * One Kafka client + producer for the process. `idempotent: true` is the load-
 * bearing flag: kafkajs then forces acks=all, bounded retries, and
 * max-in-flight=1, so a producer *session* never writes duplicates even when it
 * retries internally. That is NOT exactly-once across relay restarts — the
 * republish-after-crash gap in relay.ts still exists by design.
 */
const kafka = new Kafka({
  clientId: "identity",
  brokers: config.kafkaBrokers.split(","),
});

export const producer = kafka.producer({
  idempotent: true,
});
