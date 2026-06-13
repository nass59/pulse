import postgres from "postgres";
import { config } from "./config";

/**
 * The single shared connection pool for the whole process. In postgres.js the
 * `sql` value is *both* the tagged-template query function and the pool handle —
 * `sql\`SELECT 1\`` runs a query, `sql.end()` drains the pool. ES modules are
 * cached, so importing this file from the health route, the handlers, and the
 * relay all yield the same pool.
 */
export const sql = postgres(config.databaseUrl, {
  max: 10,
});
