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

const channelId = "8f3b2a10-0000-4000-8000-000000000001";
const streamId = "8f3b2a10-0000-4000-8000-000000000002";

const joinedTopic = EVENT_TOPICS.ViewerJoined; // chat.presence.joined.v1
const leftTopic = EVENT_TOPICS.ViewerLeft; // chat.presence.left.v1

/** Schema IDs are looked up once; presence is keyed by channelId (ADR-0012). */
const joinedId = await registry.getLatestSchemaId(`${joinedTopic}-value`);
const leftId = await registry.getLatestSchemaId(`${leftTopic}-value`);

/** Three viewers join one stream, then the first leaves — count goes 1→2→3→2. */
const viewers = [
  "8f3b2a10-0000-4000-8000-000000000010",
  "8f3b2a10-0000-4000-8000-000000000011",
  "8f3b2a10-0000-4000-8000-000000000012",
];

const producer = kafka.producer();
await producer.connect();

for (const userId of viewers) {
  const value = await registry.encode(joinedId, {
    channelId,
    streamId,
    userId,
    joinedAt: Date.now(),
  });

  await producer.send({
    topic: joinedTopic,
    messages: [{ key: channelId, value }],
  });
  console.log(`✓ ViewerJoined user=${userId}`);
}

const leftValue = await registry.encode(leftId, {
  channelId,
  streamId,
  userId: viewers[0],
  leftAt: Date.now(),
});

await producer.send({
  topic: leftTopic,
  messages: [{ key: channelId, value: leftValue }],
});

console.log(`✓ ViewerLeft user=${viewers[0]}`);

await producer.disconnect();
console.log("done — expect count 1→2→3→2 in analytics");
