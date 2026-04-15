import { v4 as uuidv4 } from 'uuid';
import { eq, desc, and } from 'drizzle-orm';
import { getDb } from '../config/database';
import { releases, workItems } from '../db/schema';
import { AppError } from '../middleware/errorHandler';
import type { ReleaseStatus } from '../types';

export async function listReleases() {
  return getDb().select().from(releases).orderBy(desc(releases.createdAt)).all();
}

export async function getReleaseByVersion(version: string) {
  return (await getDb().select().from(releases).where(eq(releases.version, version)).get()) ?? null;
}

export async function getReleaseById(id: string) {
  const release = await getDb().select().from(releases).where(eq(releases.id, id)).get();
  if (!release) throw new AppError(404, `Release ${id} not found`);
  return release;
}

export async function createRelease(version: string, name?: string) {
  const db = getDb();
  const existing = await db.select().from(releases).where(eq(releases.version, version)).get();
  if (existing) throw new AppError(409, `Release version "${version}" already exists`);

  const id = uuidv4();
  await db.insert(releases).values({
    id,
    version,
    name:      name ?? null,
    status:    'active',
    createdAt: Date.now(),
  }).run();

  return getReleaseById(id);
}

export async function updateRelease(id: string, patch: { name?: string; status?: ReleaseStatus }) {
  await getReleaseById(id); // throws 404 if missing
  await getDb().update(releases).set(patch).where(eq(releases.id, id)).run();
  return getReleaseById(id);
}

export async function deleteRelease(id: string) {
  const db = getDb();
  const release = await getReleaseById(id); // throws 404 if missing
  // Sequential deletes — work items first to satisfy FK constraint, then the release
  await db.delete(workItems).where(eq(workItems.releaseVersion, release.version)).run();
  await db.delete(releases).where(eq(releases.id, id)).run();
}

export async function getWorkItemsByRelease(
  releaseId: string,
  opts: { type?: string; page?: number; limit?: number } = {},
) {
  const db = getDb();
  const release = await getReleaseById(releaseId); // throws 404 if missing
  const { type, page = 1, limit = 50 } = opts;

  if (type) {
    return db
      .select()
      .from(workItems)
      .where(and(
        eq(workItems.releaseVersion, release.version),
        eq(workItems.type, type as 'user_story' | 'task' | 'bug' | 'feature'),
      ))
      .limit(limit)
      .offset((page - 1) * limit)
      .all();
  }

  return db
    .select()
    .from(workItems)
    .where(eq(workItems.releaseVersion, release.version))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();
}
