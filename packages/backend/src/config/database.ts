import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';
import * as schema from '../db/schema';
import { env } from './env';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const dbPath = env.NODE_ENV === 'test' ? ':memory:' : env.DATABASE_PATH;

    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    _db = drizzle(sqlite, { schema });
    runMigrations(_db);
  }
  return _db;
}

function runMigrations(db: ReturnType<typeof drizzle>) {
  db.run(`
    CREATE TABLE IF NOT EXISTS import_jobs (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      row_count INTEGER,
      rows_imported INTEGER,
      rows_skipped INTEGER,
      rows_failed INTEGER,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL UNIQUE,
      name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      import_job_id TEXT REFERENCES import_jobs(id),
      created_at INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS work_items (
      id TEXT PRIMARY KEY,
      azure_id TEXT NOT NULL UNIQUE,
      release_version TEXT,
      parent_azure_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      state TEXT NOT NULL,
      assigned_to TEXT,
      tags TEXT,
      created_date INTEGER,
      activated_date INTEGER,
      resolved_date INTEGER,
      closed_date INTEGER,
      iteration_path TEXT,
      planned_hours REAL,
      actual_hours REAL,
      story_points REAL
    )
  `);
}

/** Reset for tests — creates a fresh in-memory DB */
export function resetDb() {
  _db = null;
}
