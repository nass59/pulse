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
    /**
     * Cache the promise so concurrent first-callers share one round-trip — but
     * evict it on rejection. Otherwise a registry hiccup at boot would cache a
     * permanently-rejected promise, and every later encode for this subject
     * would fail even after the registry recovered.
     */
    id = registry.getLatestSchemaId(subject).catch((error) => {
      idCache.delete(subject);
      throw error;
    });

    idCache.set(subject, id);
  }

  return id;
};

/**
 * Best-effort warm of the id cache at boot so the first request's transaction
 * isn't blocked on a registry round-trip while holding row locks.
 */
export const warmSchemaCache = (topics: string[]): Promise<number[]> =>
  Promise.all(topics.map(schemaIdForTopic));
