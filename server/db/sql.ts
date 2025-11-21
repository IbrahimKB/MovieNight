// server/db/sql.ts
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString,
  ssl: false,
});

export async function sql<T = any>(text: string, params?: any[]) {
  const result = await pool.query<T>(text, params);
  return result;
}
