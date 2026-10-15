import { Pool } from "pg";

const globalForDb = globalThis;

export const db = globalForDb.sentinelDb || new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.sentinelDb = db;
}
