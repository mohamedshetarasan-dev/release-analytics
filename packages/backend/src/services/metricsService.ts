import { eq, and } from 'drizzle-orm';
import { getDb } from '../config/database';
import { workItems, releases } from '../db/schema';
import { AppError } from '../middleware/errorHandler';
import type { ReleaseMetrics } from '../types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function msTodays(ms: number): number {
  return Math.round((ms / MS_PER_DAY) * 10) / 10; // 1 decimal place
}

/** Fetch all metrics for a single release (by version string) */
export async function getMetricsByVersion(version: string): Promise<ReleaseMetrics> {
  const db = getDb();

  // Verify the release exists
  const release = await db.select().from(releases).where(eq(releases.version, version)).get();
  if (!release) throw new AppError(404, `Release "${version}" not found`);

  const allItems = await db.select().from(workItems).where(eq(workItems.releaseVersion, version)).all();

  if (allItems.length === 0) {
    return emptyMetrics(version);
  }

  // -----------------------------------------------------------------------
  // Metric 1: Bug count & breakdown by state
  // -----------------------------------------------------------------------
  const bugs = allItems.filter((w) => w.type === 'bug');
  const bugsByState: Record<string, number> = {};
  for (const bug of bugs) {
    bugsByState[bug.state] = (bugsByState[bug.state] ?? 0) + 1;
  }

  // -----------------------------------------------------------------------
  // Metric 2: Average bug resolution time (days)
  // resolved_date - activated_date; fallback to resolved_date - created_date
  // -----------------------------------------------------------------------
  const resolvedBugs = bugs.filter((b) => b.resolvedDate != null);
  let avgBugResolutionDays: number | null = null;
  if (resolvedBugs.length > 0) {
    let totalMs = 0;
    let counted  = 0;
    for (const bug of resolvedBugs) {
      const start  = bug.activatedDate ?? bug.createdDate;
      const end    = bug.resolvedDate!;
      if (start == null) continue;
      const diff = end - start;
      if (diff < 0) continue; // data quality issue — skip
      totalMs += diff;
      counted++;
    }
    avgBugResolutionDays = counted > 0 ? msTodays(totalMs / counted) : null;
  }

  // -----------------------------------------------------------------------
  // Metric 3: Release duration (days)
  // MAX(closed_date) - MIN(activated_date); fallback MIN(created_date)
  // -----------------------------------------------------------------------
  let releaseDurationDays: number | null = null;
  const activatedDates = allItems.map((w) => w.activatedDate).filter((d): d is number => d != null);
  const createdDates   = allItems.map((w) => w.createdDate).filter((d): d is number => d != null);
  const closedDates    = allItems.map((w) => w.closedDate).filter((d): d is number => d != null);

  const startDate = activatedDates.length > 0
    ? Math.min(...activatedDates)
    : (createdDates.length > 0 ? Math.min(...createdDates) : null);
  const endDate = closedDates.length > 0 ? Math.max(...closedDates) : null;

  if (startDate != null && endDate != null) {
    releaseDurationDays = msTodays(endDate - startDate);
  }

  // -----------------------------------------------------------------------
  // Metric 4: Planned vs actual effort
  // Tasks → planned_hours + actual_hours; User Stories → story_points
  // -----------------------------------------------------------------------
  const tasks       = allItems.filter((w) => w.type === 'task');
  const userStories = allItems.filter((w) => w.type === 'user_story');

  const plannedHours = tasks.reduce((sum, t) => sum + (t.plannedHours ?? 0), 0);
  const actualHours  = tasks.reduce((sum, t) => sum + (t.actualHours ?? 0), 0);
  const storyPoints  = userStories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);

  let effortVariancePercent: number | null = null;
  if (plannedHours > 0) {
    effortVariancePercent = Math.round(((actualHours - plannedHours) / plannedHours) * 10000) / 100;
  }

  return {
    releaseVersion:      version,
    totalBugs:           bugs.length,
    bugsByState,
    avgBugResolutionDays,
    releaseDurationDays,
    plannedHours,
    actualHours,
    effortVariancePercent,
    storyPoints,
  };
}

/** Bug-specific sub-metrics */
export async function getBugMetrics(version: string) {
  const db = getDb();
  const release = await db.select().from(releases).where(eq(releases.version, version)).get();
  if (!release) throw new AppError(404, `Release "${version}" not found`);

  const bugs = await db
    .select()
    .from(workItems)
    .where(and(eq(workItems.releaseVersion, version), eq(workItems.type, 'bug')))
    .all();

  const bugsByState: Record<string, number> = {};
  for (const bug of bugs) {
    bugsByState[bug.state] = (bugsByState[bug.state] ?? 0) + 1;
  }

  const resolvedBugs = bugs.filter((b) => b.resolvedDate != null);
  let avgResolutionDays: number | null = null;
  if (resolvedBugs.length > 0) {
    let total = 0, count = 0;
    for (const bug of resolvedBugs) {
      const start = bug.activatedDate ?? bug.createdDate;
      if (!start) continue;
      const diff = bug.resolvedDate! - start;
      if (diff < 0) continue;
      total += diff;
      count++;
    }
    avgResolutionDays = count > 0 ? msTodays(total / count) : null;
  }

  return {
    releaseVersion:   version,
    totalBugs:        bugs.length,
    resolvedBugs:     resolvedBugs.length,
    bugsByState,
    avgResolutionDays,
  };
}

/** Effort-specific sub-metrics */
export async function getEffortMetrics(version: string) {
  const db = getDb();
  const release = await db.select().from(releases).where(eq(releases.version, version)).get();
  if (!release) throw new AppError(404, `Release "${version}" not found`);

  const tasks = await db
    .select()
    .from(workItems)
    .where(and(eq(workItems.releaseVersion, version), eq(workItems.type, 'task')))
    .all();

  const userStories = await db
    .select()
    .from(workItems)
    .where(and(eq(workItems.releaseVersion, version), eq(workItems.type, 'user_story')))
    .all();

  const plannedHours = tasks.reduce((s, t) => s + (t.plannedHours ?? 0), 0);
  const actualHours  = tasks.reduce((s, t) => s + (t.actualHours ?? 0), 0);
  const storyPoints  = userStories.reduce((s, u) => s + (u.storyPoints ?? 0), 0);

  let effortVariancePercent: number | null = null;
  if (plannedHours > 0) {
    effortVariancePercent = Math.round(((actualHours - plannedHours) / plannedHours) * 10000) / 100;
  }

  return {
    releaseVersion: version,
    taskCount:      tasks.length,
    plannedHours,
    actualHours,
    effortVariancePercent,
    userStoryCount: userStories.length,
    storyPoints,
  };
}

/** Metrics for multiple releases (comparison) */
export async function getMetricsForReleases(versions: string[]): Promise<ReleaseMetrics[]> {
  return Promise.all(versions.map((v) => getMetricsByVersion(v)));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function emptyMetrics(version: string): ReleaseMetrics {
  return {
    releaseVersion:       version,
    totalBugs:            0,
    bugsByState:          {},
    avgBugResolutionDays: null,
    releaseDurationDays:  null,
    plannedHours:         0,
    actualHours:          0,
    effortVariancePercent: null,
    storyPoints:          0,
  };
}
