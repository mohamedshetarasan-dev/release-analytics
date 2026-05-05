import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../db/schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;
let _client: Client | null = null;
let _db: Db | null = null;

export function getDb(): Db {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
}

export async function initDb(): Promise<Db> {
  _client = createClient({ url: ':memory:' });
  _db = drizzle(_client, { schema });
  await runMigrations(_client);
  return _db;
}

export function resetDb(): void {
  _db = null;
  _client = null;
}

async function runMigrations(client: Client): Promise<void> {
  await client.execute(`
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

  await client.execute(`
    CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL UNIQUE,
      name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      import_job_id TEXT REFERENCES import_jobs(id),
      created_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
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
      story_points REAL,
      severity TEXT
    )
  `);
}
