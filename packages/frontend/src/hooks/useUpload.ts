import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadsApi } from '../services/uploads';
import type { ImportResult } from '../types';

export function useUpload() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setResult(null);
    setError(null);
    try {
      const res = await uploadsApi.upload(file, setProgress);
      setResult(res);
      await queryClient.invalidateQueries({ queryKey: ['releases'] });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setProgress(0);
    setResult(null);
    setError(null);
  };

  return { upload, uploading, progress, result, error, reset };
}
