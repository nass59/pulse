import { SchemaRegistry } from "@kafkajs/confluent-schema-registry";
import { config } from "./config";

/**
 * Apicurio implements the Confluent registry protocol under /apis/ccompat/v6,
 * so the Confluent client talks to it unmodified — we just point host at that
 * base path. This is the same endpoint packages/schemas/publish.ts registers to.
 */
export const registry = new SchemaRegistry({
  host: `${config.schemaRegistryUrl}/apis/ccompat/v6`,
});

const idCache = new Map<string, Promise<number>>();

/**
 * Resolve and cache the registry id for a topic's value subject
 * (TopicNameStrategy → `<topic>-value`). We cache the *promise*, so concurrent
 * first-callers share one HTTP round-trip instead of racing several.
 */
export const schemaIdForTopic = (topic: string): Promise<number> => {
  const subject = `${topic}-value`;
  let id = idCache.get(subject);

  if (!id) {
    id = registry.getLatestSchemaId(subject);
    idCache.set(subject, id);
  }

  return id;
};
