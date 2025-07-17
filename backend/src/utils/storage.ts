import fs from "fs/promises";
import path from "path";
import { Database } from "../models/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Empty DB shape
const createEmptyDatabase = (): Database => ({
  users: [],
  movies: [],
  suggestions: [],
  watchDesires: [],
  friendships: [],
  watchedMovies: [],
  notifications: [],
  releases: [],
  metadata: {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
  },
});

// Load DB (or create if missing/invalid)
export async function loadDatabase(): Promise<Database> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    const db = JSON.parse(data) as Database;
    if (!Array.isArray(db.users)) throw new Error("Invalid DB");
    return db;
  } catch {
    const empty = createEmptyDatabase();
    await saveDatabase(empty);
    return empty;
  }
}

// Save DB to disk
export async function saveDatabase(db: Database): Promise<void> {
  await ensureDataDir();
  db.metadata.lastUpdated = new Date().toISOString();
  const json = JSON.stringify(db, null, 2);
  await fs.writeFile(DB_FILE, json, "utf-8");
}

// Transaction helper
export async function withTransaction<T>(
  fn: (db: Database) => T | Promise<T>
): Promise<T> {
  const db = await loadDatabase();
  const result = await fn(db);
  await saveDatabase(db);
  return result;
}

// Simple UUID generator
import { randomUUID } from "crypto";
export function generateId(): string {
  return randomUUID();
}
