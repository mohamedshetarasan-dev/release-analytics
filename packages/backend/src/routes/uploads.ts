import { Router, Request, Response, NextFunction } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { runImport, getImportJob } from '../services/importService';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/** POST /api/v1/uploads — upload a .xlsx or .csv file and trigger import */
router.post(
  '/',
  uploadMiddleware.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded');
      }
      const result = await runImport(req.file.path, req.file.originalname);
      res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  },
);

/** GET /api/v1/uploads/:jobId — poll import job status */
router.get('/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await getImportJob(req.params.jobId as string);
    if (!job) throw new AppError(404, `Import job ${req.params.jobId} not found`);
    res.json(job);
  } catch (err) {
    next(err);
  }
});

export default router;
