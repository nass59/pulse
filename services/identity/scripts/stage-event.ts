/**
 * Dev helper: stage one real (registry-encoded) StreamStarted into the outbox,
 * commit, and exit. Run it while the app is up to watch the relay drain it to
 * Kafka. Not part of the service — a smoke-test convenience.
 */
import { sql } from "../src/db";
import { writeEvent } from "../src/outbox";

const channelId = crypto.randomUUID();
const streamId = crypto.randomUUID();

await sql.begin(async (tx) => {
  await writeEvent(tx, {
    aggregateType: "stream",
    aggregateId: streamId,
    eventType: "StreamStarted",
    topic: "stream.started.v1",
    partitionKey: channelId,
    payload: {
      streamId,
      channelId,
      startedAt: Date.now(),
      title: "relay smoke test",
    },
  });
});

console.log(`staged StreamStarted (channel=${channelId})`);

await sql.end();
