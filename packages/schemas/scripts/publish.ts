/**
 * Publishes the five Avro schemas to Apicurio's Confluent-compatible (ccompat)
 * endpoint, pins each subject's compatibility rule to BACKWARD, and reads the
 * rule back to verify it stuck.
 *
 * Run: `bun packages/schemas/publish.ts`
 *
 * Idempotent: ccompat registration returns the existing version for
 * byte-identical schemas, so re-running adds no new versions.
 */

import { readFile } from "node:fs/promises";
import { EVENT_TOPICS } from "../topics";

const REGISTRY_URL = process.env.REGISTRY_URL ?? "http://localhost:8080";
const CCOMPAT = `${REGISTRY_URL}/apis/ccompat/v6`;
const COMPATIBILITY = "BACKWARD";

const subjectOf = (topic: string) => `${topic}-value`;

/**
 * fetch() resolves (rather than rejects) on 4xx/5xx, so every registry call
 * funnels through here to turn a non-2xx response into a loud, contextual
 * error instead of a silently-swallowed failure.
 */
const request = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${CCOMPAT}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `${method} ${path} → ${res.status} ${res.statusText}\n${text}`
    );
  }

  return text ? JSON.parse(text) : undefined;
};

/**
 * Registers a schema under a subject. The ccompat contract wants the schema as
 * a JSON-encoded *string* in the `schema` field — we pass the raw file text
 * verbatim so the bytes stay stable across runs (the basis of idempotency).
 */
const registerSchema = (
  subject: string,
  schemaText: string
): Promise<{ id: number }> =>
  request("POST", `/subjects/${subject}/versions`, {
    schemaType: "AVRO",
    schema: schemaText,
  });

const setCompatibility = (subject: string) =>
  request("PUT", `/config/${subject}`, { compatibility: COMPATIBILITY });

const getCompatibility = async (subject: string): Promise<string> => {
  const { compatibilityLevel } = await request("GET", `/config/${subject}`);
  return compatibilityLevel;
};

const getVersions = (subject: string): Promise<number[]> =>
  request("GET", `/subjects/${subject}/versions`);

const schemaDir = new URL("../avro/", import.meta.url).pathname;

const publish = async () => {
  for (const [eventType, topic] of Object.entries(EVENT_TOPICS)) {
    const subject = subjectOf(topic);
    const schemaText = await readFile(`${schemaDir}${eventType}.avsc`, "utf8");

    /**
     * Order is deliberate: register first so the subject exists, then pin its
     * config (Apicurio's ccompat rejects per-subject config for an unknown
     * subject), then read the rule back rather than trusting the PUT.
     */
    const { id } = await registerSchema(subject, schemaText);
    await setCompatibility(subject);
    const level = await getCompatibility(subject);
    const versions = await getVersions(subject);

    if (level !== COMPATIBILITY) {
      throw new Error(`${subject}: expected ${COMPATIBILITY}, got ${level}`);
    }

    console.log(
      `✓ ${subject.padEnd(31)} id=${String(id).padEnd(4)} compat=${level} versions=[${versions.join(",")}]`
    );
  }
};

await publish();

console.log(
  `\nAll ${Object.keys(EVENT_TOPICS).length} schemas registered and pinned to ${COMPATIBILITY}.`
);
