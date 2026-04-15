import { Router, Request, Response, NextFunction } from 'express';
import { getDb } from '../config/database';
import { releases } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  getMetricsByVersion,
  getBugMetrics,
  getEffortMetrics,
  getMetricsForReleases,
} from '../services/metricsService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/** Resolve release ID → version string */
async function resolveVersion(id: string | string[]): Promise<string> {
  const release = await getDb().select({ version: releases.version }).from(releases).where(eq(releases.id, id as string)).get();
  if (!release) throw new AppError(404, `Release ${id} not found`);
  return release.version;
}

/** GET /api/v1/releases/:id/metrics — all metrics */
router.get('/:id/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await resolveVersion(req.params.id);
    res.json(await getMetricsByVersion(version));
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/releases/:id/metrics/bugs — bug count + resolution */
router.get('/:id/metrics/bugs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await resolveVersion(req.params.id);
    res.json(await getBugMetrics(version));
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/releases/:id/metrics/effort — planned vs actual effort */
router.get('/:id/metrics/effort', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await resolveVersion(req.params.id);
    res.json(await getEffortMetrics(version));
  } catch (err) {
    next(err);
  }
});

export default router;
