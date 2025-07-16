// backend/src/db.ts
import { Low, JSONFile } from 'lowdb';
import { join } from 'path';

type Schema = {
  users: { id: number; username: string; createdAt: string }[];
  suggestions: any[];
  watchDesire: any[];
  watchedLogs: any[];
  watchedEpisodes: any[];
};

const filePath = join(__dirname, '..', 'data.json');  // __dirname works under CJS
const adapter = new JSONFile<Schema>(filePath);
export const db = new Low<Schema>(adapter);

export async function initDB() {
  await db.read();
  db.data ||= {
    users: [],
    suggestions: [],
    watchDesire: [],
    watchedLogs: [],
    watchedEpisodes: []
  };
  await db.write();
}
