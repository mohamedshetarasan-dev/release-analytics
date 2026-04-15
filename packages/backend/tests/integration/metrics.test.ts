import request from 'supertest';
import { resetDb, initDb, getDb } from '../../src/config/database';
import { workItems } from '../../src/db/schema';
import app from '../../src/app';
import { createRelease } from '../../src/services/releaseService';
import { v4 as uuidv4 } from 'uuid';

const DAY_MS = 1000 * 60 * 60 * 24;

beforeEach(async () => {
  resetDb();
  await initDb();
});

async function seedWorkItems(version: string, items: Partial<typeof workItems.$inferInsert>[]) {
  const db = getDb();
  for (const item of items) {
    await db.insert(workItems).values({
      id:             uuidv4(),
      azureId:        uuidv4(),
      releaseVersion: version,
      type:           'task',
      title:          'Test item',
      state:          'Active',
      ...item,
    }).run();
  }
}

describe('GET /api/v1/releases/:id/metrics', () => {
  it('returns all metrics for a release', async () => {
    const release = await createRelease('1.0.0');
    const base = new Date('2025-01-01').getTime();
    await seedWorkItems('1.0.0', [
      { type: 'bug',        state: 'Resolved', activatedDate: base, resolvedDate: base + 3 * DAY_MS, closedDate: base + 3 * DAY_MS },
      { type: 'task',       state: 'Closed',   activatedDate: base, closedDate: base + 10 * DAY_MS, plannedHours: 8, actualHours: 10 },
      { type: 'user_story', state: 'Closed',   activatedDate: base, closedDate: base + 10 * DAY_MS, storyPoints: 5 },
    ]);

    const res = await request(app).get(`/api/v1/releases/${release.id}/metrics`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      releaseVersion:      '1.0.0',
      totalBugs:           1,
      plannedHours:        8,
      actualHours:         10,
      storyPoints:         5,
      avgBugResolutionDays: 3,
    });
  });

  it('returns 404 for unknown release ID', async () => {
    const res = await request(app).get('/api/v1/releases/bad-id/metrics');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/releases/:id/metrics/bugs', () => {
  it('returns bug-specific metrics', async () => {
    const release = await createRelease('1.0.0');
    const base = new Date('2025-01-01').getTime();
    await seedWorkItems('1.0.0', [
      { type: 'bug', state: 'Resolved', activatedDate: base, resolvedDate: base + 2 * DAY_MS },
      { type: 'bug', state: 'Active' },
    ]);

    const res = await request(app).get(`/api/v1/releases/${release.id}/metrics/bugs`);
    expect(res.status).toBe(200);
    expect(res.body.totalBugs).toBe(2);
    expect(res.body.resolvedBugs).toBe(1);
    expect(res.body.avgResolutionDays).toBe(2);
  });
});

describe('GET /api/v1/releases/:id/metrics/effort', () => {
  it('returns effort metrics', async () => {
    const release = await createRelease('1.0.0');
    await seedWorkItems('1.0.0', [
      { type: 'task',       plannedHours: 10, actualHours: 15 },
      { type: 'user_story', storyPoints: 8 },
    ]);

    const res = await request(app).get(`/api/v1/releases/${release.id}/metrics/effort`);
    expect(res.status).toBe(200);
    expect(res.body.plannedHours).toBe(10);
    expect(res.body.actualHours).toBe(15);
    expect(res.body.storyPoints).toBe(8);
    expect(res.body.effortVariancePercent).toBe(50);
  });
});

describe('GET /api/v1/releases/compare', () => {
  it('returns metrics for multiple releases', async () => {
    const r1 = await createRelease('1.0.0');
    const r2 = await createRelease('2.0.0');
    await seedWorkItems('1.0.0', [{ type: 'bug', state: 'Active' }]);
    await seedWorkItems('2.0.0', [{ type: 'bug', state: 'Active' }, { type: 'bug', state: 'Resolved' }]);

    const res = await request(app).get(`/api/v1/releases/compare?ids=${r1.id},${r2.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.find((m: { releaseVersion: string }) => m.releaseVersion === '1.0.0').totalBugs).toBe(1);
    expect(res.body.find((m: { releaseVersion: string }) => m.releaseVersion === '2.0.0').totalBugs).toBe(2);
  });

  it('returns 400 when ids param is missing', async () => {
    const res = await request(app).get('/api/v1/releases/compare');
    expect(res.status).toBe(400);
  });
});
