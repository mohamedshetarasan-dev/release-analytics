import multer from 'multer';
import path from 'path';
import { AppError } from './errorHandler';

const ALLOWED_MIME = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ALLOWED_EXT = new Set(['.csv', '.xlsx', '.xls']);

export const uploadMiddleware = multer({
  dest: '/tmp/release-analytics-uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) || ALLOWED_EXT.has(ext)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only .csv and .xlsx files are accepted'));
    }
  },
});
