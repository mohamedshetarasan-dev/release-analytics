import { resetDb, initDb, getDb } from '../../src/config/database';
import {
  listReleases,
  getReleaseById,
  createRelease,
  updateRelease,
  deleteRelease,
  getWorkItemsByRelease,
} from '../../src/services/releaseService';
import { AppError } from '../../src/middleware/errorHandler';
import { workItems } from '../../src/db/schema';
import { v4 as uuidv4 } from 'uuid';

beforeEach(async () => {
  resetDb();
  await initDb();
});

describe('createRelease', () => {
  it('creates a release and returns it', async () => {
    const release = await createRelease('1.0.0', 'First Release');
    expect(release.version).toBe('1.0.0');
    expect(release.name).toBe('First Release');
    expect(release.status).toBe('active');
  });

  it('throws 409 on duplicate version', async () => {
    await createRelease('1.0.0');
    await expect(createRelease('1.0.0')).rejects.toThrow(AppError);
    await expect(createRelease('1.0.0')).rejects.toThrow(/already exists/);
  });
});

describe('listReleases', () => {
  it('returns empty array when no releases', async () => {
    expect(await listReleases()).toEqual([]);
  });

  it('returns all releases', async () => {
    await createRelease('1.0.0');
    await createRelease('2.0.0');
    expect(await listReleases()).toHaveLength(2);
  });
});

describe('getReleaseById', () => {
  it('returns release by ID', async () => {
    const created = await createRelease('1.0.0');
    const found = await getReleaseById(created.id);
    expect(found.id).toBe(created.id);
  });

  it('throws 404 for unknown ID', async () => {
    await expect(getReleaseById('bad-id')).rejects.toThrow(AppError);
    await expect(getReleaseById('bad-id')).rejects.toThrow(/not found/);
  });
});

describe('updateRelease', () => {
  it('updates name and status', async () => {
    const release = await createRelease('1.0.0');
    const updated = await updateRelease(release.id, { name: 'New Name', status: 'completed' });
    expect(updated.name).toBe('New Name');
    expect(updated.status).toBe('completed');
  });

  it('throws 404 for unknown ID', async () => {
    await expect(updateRelease('bad-id', { name: 'x' })).rejects.toThrow(AppError);
  });
});

describe('deleteRelease', () => {
  it('deletes the release and its work items', async () => {
    const release = await createRelease('1.0.0');
    const db = getDb();
    await db.insert(workItems).values({
      id: uuidv4(),
      azureId: 'wi-1',
      releaseVersion: '1.0.0',
      type: 'task',
      title: 'Test task',
      state: 'Active',
    }).run();

    await deleteRelease(release.id);

    await expect(getReleaseById(release.id)).rejects.toThrow(AppError);
    const remaining = await db.select().from(workItems).all();
    expect(remaining).toHaveLength(0);
  });

  it('throws 404 for unknown ID', async () => {
    await expect(deleteRelease('bad-id')).rejects.toThrow(AppError);
  });
});

describe('getWorkItemsByRelease', () => {
  it('returns work items for a release', async () => {
    const release = await createRelease('1.0.0');
    const db = getDb();
    await db.insert(workItems).values([
      { id: uuidv4(), azureId: 'wi-1', releaseVersion: '1.0.0', type: 'bug',  title: 'Bug 1',  state: 'Active' },
      { id: uuidv4(), azureId: 'wi-2', releaseVersion: '1.0.0', type: 'task', title: 'Task 1', state: 'Closed' },
    ]).run();

    const items = await getWorkItemsByRelease(release.id);
    expect(items).toHaveLength(2);
  });

  it('respects type filter', async () => {
    const release = await createRelease('1.0.0');
    const db = getDb();
    await db.insert(workItems).values([
      { id: uuidv4(), azureId: 'wi-1', releaseVersion: '1.0.0', type: 'bug',  title: 'Bug 1',  state: 'Active' },
      { id: uuidv4(), azureId: 'wi-2', releaseVersion: '1.0.0', type: 'task', title: 'Task 1', state: 'Closed' },
    ]).run();

    const bugs = await getWorkItemsByRelease(release.id, { type: 'bug' });
    expect(bugs).toHaveLength(1);
    expect(bugs[0].type).toBe('bug');
  });

  it('paginates results', async () => {
    const release = await createRelease('1.0.0');
    const db = getDb();
    for (let i = 0; i < 5; i++) {
      await db.insert(workItems).values({
        id: uuidv4(), azureId: `wi-${i}`, releaseVersion: '1.0.0', type: 'task', title: `Task ${i}`, state: 'Active',
      }).run();
    }
    const page1 = await getWorkItemsByRelease(release.id, { limit: 3, page: 1 });
    const page2 = await getWorkItemsByRelease(release.id, { limit: 3, page: 2 });
    expect(page1).toHaveLength(3);
    expect(page2).toHaveLength(2);
  });
});
