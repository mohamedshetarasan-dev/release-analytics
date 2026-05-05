import { Router, Request, Response, NextFunction } from 'express';
import { getDb } from '../config/database';
import { releases, workItems, importJobs } from '../db/schema';

const router = Router();

/** DELETE /api/v1/admin/clear — wipe all data from all tables */
router.delete('/clear', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    await db.delete(workItems);
    await db.delete(releases);
    await db.delete(importJobs);
    res.json({ message: 'Database cleared successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
