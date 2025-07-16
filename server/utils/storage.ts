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
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

// Initialize database with sample data if empty
export async function initializeDatabase(): Promise<void> {
  const db = await loadDatabase();

  // Only initialize if database is empty
  if (db.users.length === 0) {
    console.log("Initializing database with sample data...");

    // Create sample users
    const sampleUsers = [
      {
        id: "user-1",
        username: "ibrahim",
        email: "ibrahim@example.com",
        name: "Ibrahim Kaysar",
        password: "password123", // In production, hash this
        joinedAt: "2024-01-01T00:00:00Z",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-2",
        username: "omar",
        email: "omar@example.com",
        name: "Omar",
        password: "password123",
        joinedAt: "2024-01-02T00:00:00Z",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-3",
        username: "sara",
        email: "sara@example.com",
        name: "Sara",
        password: "password123",
        joinedAt: "2024-01-03T00:00:00Z",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-4",
        username: "alex",
        email: "alex@example.com",
        name: "Alex",
        password: "password123",
        joinedAt: "2024-01-04T00:00:00Z",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "user-5",
        username: "maya",
        email: "maya@example.com",
        name: "Maya",
        password: "password123",
        joinedAt: "2024-01-05T00:00:00Z",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Create sample movies
    const sampleMovies = [
      {
        id: "movie-1",
        title: "The Menu",
        year: 2022,
        genres: ["Thriller", "Horror"],
        description:
          "A young couple travels to a remote island to eat at an exclusive restaurant where the chef has prepared a lavish menu, with some shocking surprises.",
        imdbRating: 7.2,
        rtRating: 88,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "movie-2",
        title: "Glass Onion: A Knives Out Mystery",
        year: 2022,
        genres: ["Mystery", "Comedy"],
        description:
          "Tech billionaire Miles Bron invites his friends for a getaway on his private Greek island. When someone turns up dead, Detective Benoit Blanc is put on the case.",
        imdbRating: 7.1,
        rtRating: 85,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "movie-3",
        title: "Avatar: The Way of Water",
        year: 2022,
        genres: ["Action", "Adventure", "Sci-Fi"],
        description:
          "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race to protect their home.",
        imdbRating: 7.6,
        rtRating: 76,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Create sample releases
    const sampleReleases = [
      {
        id: "release-1",
        title: "The Menu",
        platform: "Netflix",
        releaseDate: "2024-01-15",
        genres: ["Thriller", "Horror"],
        year: 2022,
        description:
          "A young couple travels to a remote island to eat at an exclusive restaurant.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "release-2",
        title: "Glass Onion",
        platform: "Netflix",
        releaseDate: "2024-01-16",
        genres: ["Mystery", "Comedy"],
        year: 2022,
        description:
          "Detective Benoit Blanc travels to Greece to solve a mystery.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "release-3",
        title: "Avatar: The Way of Water",
        platform: "Disney+",
        releaseDate: "2024-01-17",
        genres: ["Action", "Adventure", "Sci-Fi"],
        year: 2022,
        description: "Jake Sully continues his story on Pandora.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Add sample friendships
    const sampleFriendships = [
      {
        id: "friendship-1",
        userId1: "user-1",
        userId2: "user-2",
        status: "accepted" as const,
        requestedBy: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "friendship-2",
        userId1: "user-1",
        userId2: "user-3",
        status: "accepted" as const,
        requestedBy: "user-3",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Update database
    db.users = sampleUsers;
    db.movies = sampleMovies;
    db.releases = sampleReleases;
    db.friendships = sampleFriendships;

    await saveDatabase(db);
    console.log("Database initialized with sample data");
  }
}
