import {
  EVENT_TOPICS,
  type EventPayloads,
  type EventType,
} from "@pulse/schemas/topics";
import type { TransactionSql } from "postgres";
import { registry, schemaIdForTopic } from "./registry";

export type OutboxEvent<K extends EventType> = {
  aggregateId: string;
  aggregateType: string;
  eventType: K;
  partitionKey: string;
  payload: EventPayloads[K];
};

export const writeEvent = async <K extends EventType>(
  tx: TransactionSql,
  event: OutboxEvent<K>
): Promise<void> => {
  const topic = EVENT_TOPICS[event.eventType];
  const schemaId = await schemaIdForTopic(topic);
  const payload = await registry.encode(schemaId, event.payload);

  await tx`
    INSERT INTO outbox
      (aggregate_type, aggregate_id, event_type, payload, topic, partition_key)
    VALUES
      (${event.aggregateType}, ${event.aggregateId}, ${event.eventType},
       ${payload}, ${topic},${event.partitionKey})
  `;
};
