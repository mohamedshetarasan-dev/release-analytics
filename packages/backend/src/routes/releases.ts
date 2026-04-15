import { Router, Request, Response, NextFunction } from 'express';
import {
  listReleases,
  getReleaseById,
  createRelease,
  updateRelease,
  deleteRelease,
  getWorkItemsByRelease,
} from '../services/releaseService';
import { getMetricsForReleases } from '../services/metricsService';
import { getDb } from '../config/database';
import { releases } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/** GET /api/v1/releases/compare?ids=a,b,c — must come before /:id to avoid conflicts */
router.get('/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idsParam = req.query.ids as string | undefined;
    if (!idsParam) throw new AppError(400, '"ids" query param is required (comma-separated release IDs)');
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) throw new AppError(400, 'At least one release ID is required');
    const versions = await Promise.all(ids.map(async (id) => {
      const r = await getDb().select({ version: releases.version }).from(releases).where(eq(releases.id, id)).get();
      if (!r) throw new AppError(404, `Release ${id} not found`);
      return r.version;
    }));
    res.json(await getMetricsForReleases(versions));
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/releases — list all releases */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await listReleases());
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/releases — create a release manually */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { version, name } = req.body as { version?: string; name?: string };
    if (!version) throw new AppError(400, '"version" is required');
    res.status(201).json(await createRelease(version, name));
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/releases/:id — single release */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await getReleaseById(req.params.id as string));
  } catch (err) {
    next(err);
  }
});

/** PUT /api/v1/releases/:id — update name / status */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, status } = req.body as { name?: string; status?: 'active' | 'completed' };
    if (status && !['active', 'completed'].includes(status)) {
      throw new AppError(400, 'status must be "active" or "completed"');
    }
    res.json(await updateRelease(req.params.id as string, { name, status }));
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/v1/releases/:id — delete release + its work items */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteRelease(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/releases/:id/work-items — paginated work items */
router.get('/:id/work-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, page, limit } = req.query as Record<string, string | undefined>;
    const items = await getWorkItemsByRelease(req.params.id as string, {
      type,
      page:  page  ? parseInt(page,  10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
