import { SchemaRegistry } from "@kafkajs/confluent-schema-registry";
import { Kafka } from "kafkajs";
import { EVENT_TOPICS } from "../topics";

const registry = new SchemaRegistry({
  host: "http://localhost:8080/apis/ccompat/v7",
});

const kafka = new Kafka({
  clientId: "presence-producer",
  brokers: ["localhost:9092"],
});

const topic = EVENT_TOPICS.ViewerJoined; // chat.presence.joined.v1
const channelId = "8f3b2a10-0000-4000-8000-000000000001";

/** Look up the registered schema's ID by subject, then Avro-encode against it. */
const id = await registry.getLatestSchemaId(`${topic}-value`);
const value = await registry.encode(id, {
  channelId,
  streamId: "8f3b2a10-0000-4000-8000-000000000002",
  userId: "8f3b2a10-0000-4000-8000-000000000003",
  joinedAt: Date.now(),
});

const producer = kafka.producer();
await producer.connect();
await producer.send({ topic, messages: [{ key: channelId, value }] });
await producer.disconnect();

console.log(`✓ produced ViewerJoined to ${topic} (key=${channelId})`);
