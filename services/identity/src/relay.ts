import type { FastifyBaseLogger } from "fastify";
import { config } from "./config";
import { sql } from "./db";
import { producer } from "./kafka";

const BATCH_SIZE = 100;

interface OutboxRow {
  id: string;
  partitionKey: string;
  payload: Uint8Array;
  topic: string;
}

let running = false;
let connected = false;
let loop: Promise<void> | null = null;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Claim a batch of unpublished events, publish each to Kafka, then mark them
 * published — all in ONE transaction. FOR UPDATE SKIP LOCKED holds a row lock
 * on each claimed row until COMMIT, so concurrent relay instances each grab a
 * disjoint batch (they skip rows the others locked) and never double-publish.
 *
 * The crash window IS the lesson: die after Kafka acks but before COMMIT, and
 * the UPDATE never lands, the locks release, and those rows are claimed again
 * on restart — republished. That is at-least-once, and it is exactly why
 * consumers must be idempotent.
 */
const drainOnce = (): Promise<number> =>
  sql.begin(async (tx) => {
    const rows = await tx<OutboxRow[]>`
      SELECT id, topic, partition_key, payload
      FROM outbox
      WHERE published_at IS NULL
      ORDER BY id
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    `;

    if (rows.length === 0) {
      return 0;
    }

    for (const row of rows) {
      await producer.send({
        topic: row.topic,
        messages: [{ key: row.partitionKey, value: Buffer.from(row.payload) }],
      });
    }

    await tx`
      UPDATE outbox SET published_at = now()
      WHERE id IN ${tx(rows.map((row) => row.id))}
    `;

    return rows.length;
  });

const runLoop = async (logger: FastifyBaseLogger): Promise<void> => {
  while (running) {
    try {
      if (!connected) {
        await producer.connect();
        connected = true;
        logger.info("relay connected to Kafka");
      }

      const published = await drainOnce();

      if (published > 0) {
        logger.info({ published }, "relay published outbox batch");
      } else {
        await sleep(config.relayPollMs);
      }
    } catch (error) {
      connected = false;
      logger.error(error, "relay iteration failed; backing off");
      await sleep(config.relayPollMs);
    }
  }
};

/** Start the polling loop in the background; never throws into the caller. */
export const startRelay = (logger: FastifyBaseLogger): void => {
  running = true;
  loop = runLoop(logger);
};

/** Stop the loop, wait for the in-flight iteration to finish, then disconnect. */
export const stopRelay = async (): Promise<void> => {
  running = false;

  await loop;

  if (connected) {
    await producer.disconnect();
    connected = false;
  }
};
