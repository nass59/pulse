import type { Topic } from "@pulse/schemas/topics";
import type { TransactionSql } from "postgres";
import { registry, schemaIdForTopic } from "./registry";

export interface OutboxEvent {
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  partitionKey: string;
  payload: Record<string, unknown>;
  topic: Topic;
}

export const writeEvent = async (
  tx: TransactionSql,
  event: OutboxEvent
): Promise<void> => {
  const schemaId = await schemaIdForTopic(event.topic);
  const payload = await registry.encode(schemaId, event.payload);

  await tx`
    INSERT INTO outbox
      (aggregate_type, aggregate_id, event_type, payload, topic, partition_key)
    VALUES
      (${event.aggregateType}, ${event.aggregateId}, ${event.eventType},
       ${payload}, ${event.topic},${event.partitionKey})
  `;
};
