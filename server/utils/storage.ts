import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
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

// Initialize empty database structure
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

// Load database from JSON file
export async function loadDatabase(): Promise<Database> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    const db = JSON.parse(data) as Database;

    // Validate database structure
    if (!db.users || !Array.isArray(db.users)) {
      console.warn("Invalid database structure, reinitializing...");
      return createEmptyDatabase();
    }

    return db;
  } catch (error) {
    console.log("No existing database found, creating new one...");
    const emptyDb = createEmptyDatabase();
    await saveDatabase(emptyDb);
    return emptyDb;
  }
}

// Save database to JSON file
export async function saveDatabase(db: Database): Promise<void> {
  await ensureDataDir();

  // Update metadata
  db.metadata.lastUpdated = new Date().toISOString();

  // Write with pretty formatting for readability
  const jsonData = JSON.stringify(db, null, 2);
  await fs.writeFile(DB_FILE, jsonData, "utf-8");
}

// Backup database
export async function backupDatabase(): Promise<void> {
  await ensureDataDir();

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(DATA_DIR, `database-backup-${timestamp}.json`);

    const db = await loadDatabase();
    const jsonData = JSON.stringify(db, null, 2);
    await fs.writeFile(backupFile, jsonData, "utf-8");

    console.log(`Database backed up to: ${backupFile}`);
  } catch (error) {
    console.error("Failed to backup database:", error);
  }
}

// Generate unique ID
export function generateId(): string {
  return randomUUID();
}

// Database transaction helper
export async function withTransaction<T>(
  operation: (db: Database) => T | Promise<T>,
): Promise<T> {
  const db = await loadDatabase();

  try {
    const result = await operation(db);
    await saveDatabase(db);
    return result;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

// Initialize database - no dummy data
export async function initializeDatabase(): Promise<void> {
  const db = await loadDatabase();

  // Database starts empty - users will sign up and add content organically
  console.log("Database initialized (no dummy data)");
}
