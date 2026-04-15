import path from 'path';
import fs from 'fs';
import os from 'os';
import { resetDb, initDb, getDb } from '../../src/config/database';
import { workItems, releases, importJobs } from '../../src/db/schema';
import { runImport, getImportJob } from '../../src/services/importService';

const FIXTURE_CSV = path.join(__dirname, '../fixtures/sample-export.csv');

/** Copy fixture to a tmp path so importService can delete it safely */
function copyToTmp(src: string): string {
  const dest = path.join(os.tmpdir(), `test-import-${Date.now()}.csv`);
  fs.copyFileSync(src, dest);
  return dest;
}

beforeEach(async () => {
  resetDb();
  await initDb();
});

describe('runImport — happy path', () => {
  it('imports User Stories, Tasks, and Bugs; skips Test Case and Release Note', async () => {
    const result = await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');

    // Rows 109 (Test Case), 110 (Release Note) → skipped
    // Row 111 (Bug, no parent, no Release Version) → error / unresolved
    expect(result.rowsSkipped).toBe(2); // Test Case + Release Note
    expect(result.rowsImported).toBeGreaterThan(0);
    expect(result.jobId).toBeDefined();
  });

  it('creates releases for each unique Release Version', async () => {
    await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');
    const db = getDb();
    const allReleases = await db.select().from(releases).all();
    const versions = allReleases.map((r) => r.version);
    expect(versions).toContain('3.20.1');
    expect(versions).toContain('4.0.0');
  });

  it('inherits Release Version from parent for Bugs/Tasks with empty Release Version', async () => {
    await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');
    const db = getDb();
    const all = await db.select().from(workItems).all();
    const task = all.find((w) => w.azureId === '102');
    expect(task).toBeDefined();
    expect(task!.releaseVersion).toBe('3.20.1');
  });

  it('strips email from Assigned To field', async () => {
    await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');
    const db = getDb();
    const all = await db.select().from(workItems).all();
    const item = all.find((w) => w.azureId === '101');
    expect(item!.assignedTo).toBe('Alice Smith');
  });

  it('stores null for assignedTo when field is empty', async () => {
    await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');
    const db = getDb();
    const all = await db.select().from(workItems).all();
    const item = all.find((w) => w.azureId === '105');
    expect(item!.assignedTo).toBeNull();
  });

  it('marks import job as completed', async () => {
    const result = await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');
    const job = await getImportJob(result.jobId);
    expect(job!.status).toBe('completed');
    expect(job!.completedAt).not.toBeNull();
  });

  it('stores planned and actual hours for Tasks', async () => {
    await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');
    const db = getDb();
    const all = await db.select().from(workItems).all();
    const task = all.find((w) => w.azureId === '102');
    expect(task!.plannedHours).toBe(16);
    expect(task!.actualHours).toBe(14);
  });

  it('stores story points for User Stories', async () => {
    await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');
    const db = getDb();
    const all = await db.select().from(workItems).all();
    const story = all.find((w) => w.azureId === '101');
    expect(story!.storyPoints).toBe(8);
  });
});

describe('runImport — idempotency', () => {
  it('re-importing the same file does not create duplicate work items', async () => {
    await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');
    await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');

    const db = getDb();
    const all = await db.select().from(workItems).all();
    const ids = all.map((w) => w.azureId);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });
});

describe('runImport — orphan rows', () => {
  it('reports an error for bugs with no Release Version and no parent', async () => {
    const result = await runImport(copyToTmp(FIXTURE_CSV), 'sample-export.csv');
    // Row 111 is a Bug with no parent and no Release Version
    const orphanError = result.errors.find((e) => e.message.includes('111'));
    expect(orphanError).toBeDefined();
  });
});

describe('runImport — empty file', () => {
  it('handles a CSV with only a header row', async () => {
    const emptyPath = path.join(os.tmpdir(), `empty-${Date.now()}.csv`);
    fs.writeFileSync(
      emptyPath,
      'ID,Work Item Type,Parent,Title,Assigned To,State,Tags,Release Version,Created Date,Activated Date,Resolved Date,Closed Date,Iteration Path,Original Estimate,Completed Work,Story Points\n',
    );
    const result = await runImport(emptyPath, 'empty.csv');
    expect(result.rowsImported).toBe(0);
    expect(result.rowsSkipped).toBe(0);
    expect(result.rowsFailed).toBe(0);
  });
});

describe('getImportJob', () => {
  it('returns null for unknown job ID', async () => {
    expect(await getImportJob('nonexistent')).toBeNull();
  });
});
