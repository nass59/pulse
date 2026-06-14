import { EVENT_TOPICS } from "@pulse/schemas/topics";
import Fastify from "fastify";
import { config } from "./config";
import { sql } from "./db";
import { warmSchemaCache } from "./registry";
import { startRelay, stopRelay } from "./relay";
import { registerStreamRoutes } from "./routes";

const app = Fastify({
  logger: true,
});

/**
 * Liveness/readiness in one: report healthy only when Postgres answers. A
 * `SELECT 1` is the cheapest possible round-trip that proves the pool can
 * acquire a connection and the DB is reachable.
 */
app.get("/health", async (_request, reply) => {
  try {
    await sql`SELECT 1`;

    return { status: "ok" };
  } catch (error) {
    app.log.error(error, "health check failed: database unreachable");
    return reply.code(503).send({ status: "unavailable" });
  }
});

/**
 * Closing the DB pool is registered as an onClose hook rather than called
 * inline, so it runs *after* Fastify has stopped accepting connections and
 * drained in-flight requests — never while a request is still mid-query.
 */
app.addHook("onClose", async () => {
  await sql.end({ timeout: 5 });
});

let shuttingDown = false;

const shutdown = async (signal: string) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  app.log.info(`${signal} received, shutting down`);

  try {
    await stopRelay(); // ① stop the loop + disconnect producer FIRST
    await app.close(); // ② drain HTTP, then the onClose hook closes the pool
    process.exit(0);
  } catch (error) {
    app.log.error(error, "error during shutdown");
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

registerStreamRoutes(app);

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
  startRelay(app.log);
  warmSchemaCache([EVENT_TOPICS.StreamStarted, EVENT_TOPICS.StreamEnded]).catch(
    (error) => {
      app.log.warn(
        error,
        "schema cache warm failed; will lazy-load on first event"
      );
    }
  );
} catch (error) {
  app.log.error(error, "failed to start");
  process.exit(1);
}
