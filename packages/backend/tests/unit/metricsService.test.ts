import { resetDb, initDb, getDb } from '../../src/config/database';
import { releases, workItems } from '../../src/db/schema';
import { getMetricsByVersion, getBugMetrics, getEffortMetrics } from '../../src/services/metricsService';
import { AppError } from '../../src/middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const DAY_MS = 1000 * 60 * 60 * 24;

/** Helper to insert a release + work items for a test */
async function seed(version: string, items: Partial<typeof workItems.$inferInsert>[]) {
  const db = getDb();
  await db.insert(releases).values({ id: uuidv4(), version, status: 'active', createdAt: Date.now() }).run();
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

beforeEach(async () => {
  resetDb();
  await initDb();
});

describe('getMetricsByVersion — not found', () => {
  it('throws 404 for unknown version', async () => {
    await expect(getMetricsByVersion('99.0.0')).rejects.toThrow(AppError);
  });
});

describe('getMetricsByVersion — empty release', () => {
  it('returns zeroed metrics when no work items', async () => {
    const db = getDb();
    await db.insert(releases).values({ id: uuidv4(), version: '1.0.0', status: 'active', createdAt: Date.now() }).run();
    const m = await getMetricsByVersion('1.0.0');
    expect(m.totalBugs).toBe(0);
    expect(m.avgBugResolutionDays).toBeNull();
    expect(m.releaseDurationDays).toBeNull();
    expect(m.plannedHours).toBe(0);
    expect(m.actualHours).toBe(0);
    expect(m.storyPoints).toBe(0);
  });
});

describe('Bug count metrics', () => {
  it('counts bugs and groups by state', async () => {
    await seed('1.0.0', [
      { type: 'bug', state: 'Resolved' },
      { type: 'bug', state: 'Resolved' },
      { type: 'bug', state: 'Active'   },
      { type: 'task', state: 'Closed'  },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.totalBugs).toBe(3);
    expect(m.bugsByState['Resolved']).toBe(2);
    expect(m.bugsByState['Active']).toBe(1);
  });
});

describe('Bug resolution time', () => {
  it('calculates avg resolution using activatedDate', async () => {
    const base = new Date('2025-01-01').getTime();
    await seed('1.0.0', [
      { type: 'bug', state: 'Resolved', activatedDate: base, resolvedDate: base + 2 * DAY_MS },
      { type: 'bug', state: 'Resolved', activatedDate: base, resolvedDate: base + 4 * DAY_MS },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.avgBugResolutionDays).toBe(3); // (2+4)/2
  });

  it('falls back to createdDate when activatedDate is null', async () => {
    const base = new Date('2025-01-01').getTime();
    await seed('1.0.0', [
      { type: 'bug', state: 'Resolved', createdDate: base, activatedDate: null, resolvedDate: base + 5 * DAY_MS },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.avgBugResolutionDays).toBe(5);
  });

  it('excludes bugs with no resolvedDate', async () => {
    await seed('1.0.0', [
      { type: 'bug', state: 'Active', resolvedDate: null },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.avgBugResolutionDays).toBeNull();
  });

  it('excludes bugs where resolvedDate < activatedDate (data quality)', async () => {
    const base = new Date('2025-01-10').getTime();
    await seed('1.0.0', [
      { type: 'bug', state: 'Resolved', activatedDate: base, resolvedDate: base - DAY_MS }, // bad data
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.avgBugResolutionDays).toBeNull();
  });
});

describe('Release duration', () => {
  it('computes duration from min(activatedDate) to max(closedDate)', async () => {
    const base = new Date('2025-01-01').getTime();
    await seed('1.0.0', [
      { type: 'task',       activatedDate: base,             closedDate: base + 10 * DAY_MS },
      { type: 'user_story', activatedDate: base + DAY_MS,    closedDate: base + 20 * DAY_MS },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.releaseDurationDays).toBe(20);
  });

  it('falls back to createdDate when all activatedDates are null', async () => {
    const base = new Date('2025-01-01').getTime();
    await seed('1.0.0', [
      { type: 'task', createdDate: base, activatedDate: null, closedDate: base + 10 * DAY_MS },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.releaseDurationDays).toBe(10);
  });

  it('returns null duration when no closedDates present', async () => {
    const base = new Date('2025-01-01').getTime();
    await seed('1.0.0', [
      { type: 'task', activatedDate: base, closedDate: null },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.releaseDurationDays).toBeNull();
  });
});

describe('Effort metrics', () => {
  it('sums planned and actual hours for tasks', async () => {
    await seed('1.0.0', [
      { type: 'task', plannedHours: 8,  actualHours: 10 },
      { type: 'task', plannedHours: 16, actualHours: 12 },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.plannedHours).toBe(24);
    expect(m.actualHours).toBe(22);
  });

  it('sums story points for user stories', async () => {
    await seed('1.0.0', [
      { type: 'user_story', storyPoints: 5  },
      { type: 'user_story', storyPoints: 13 },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.storyPoints).toBe(18);
  });

  it('calculates effort variance percent', async () => {
    await seed('1.0.0', [
      { type: 'task', plannedHours: 10, actualHours: 12 },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.effortVariancePercent).toBe(20); // (12-10)/10 * 100
  });

  it('returns null variance when no planned hours', async () => {
    await seed('1.0.0', [
      { type: 'task', plannedHours: null, actualHours: 8 },
    ]);
    const m = await getMetricsByVersion('1.0.0');
    expect(m.effortVariancePercent).toBeNull();
  });
});

describe('getBugMetrics', () => {
  it('returns bug-specific breakdown', async () => {
    const base = new Date('2025-01-01').getTime();
    await seed('1.0.0', [
      { type: 'bug', state: 'Resolved', activatedDate: base, resolvedDate: base + 3 * DAY_MS },
    ]);
    const bm = await getBugMetrics('1.0.0');
    expect(bm.totalBugs).toBe(1);
    expect(bm.resolvedBugs).toBe(1);
    expect(bm.avgResolutionDays).toBe(3);
  });
});

describe('getEffortMetrics', () => {
  it('returns effort-specific breakdown', async () => {
    await seed('1.0.0', [
      { type: 'task',       plannedHours: 8,  actualHours: 10 },
      { type: 'user_story', storyPoints: 5 },
    ]);
    const em = await getEffortMetrics('1.0.0');
    expect(em.plannedHours).toBe(8);
    expect(em.actualHours).toBe(10);
    expect(em.storyPoints).toBe(5);
    expect(em.effortVariancePercent).toBe(25);
  });
});
