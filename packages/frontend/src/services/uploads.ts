import { api } from './api';
import type { ImportResult } from '../types';

export const uploadsApi = {
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<ImportResult>('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      })
      .then((r) => r.data);
  },

  getJobStatus: (jobId: string) =>
    api.get<ImportResult>(`/uploads/${jobId}`).then((r) => r.data),
};
