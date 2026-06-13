import { afterAll, expect, test } from "bun:test";
import { sql } from "./db";
import { writeEvent } from "./outbox";

test("writeEvent rolls back with the surrounding transaction", async () => {
  const [{ n: before }] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM outbox
  `;

  const attempt = sql.begin(async (tx) => {
    await writeEvent(tx, {
      aggregateType: "stream",
      aggregateId: crypto.randomUUID(),
      eventType: "StreamStarted",
      topic: "stream.started.v1",
      partitionKey: crypto.randomUUID(),
      payload: {
        streamId: crypto.randomUUID(),
        channelId: crypto.randomUUID(),
        startedAt: Date.now(),
        title: "rollback test",
      },
    });
    throw new Error("boom"); // business write fails AFTER the event is staged
  });

  await expect(attempt).rejects.toThrow("boom");

  const [{ n: after }] = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM outbox
  `;
  expect(after).toBe(before); // the staged row vanished with the rollback
});

afterAll(async () => {
  await sql.end();
});
