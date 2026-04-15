import { useQuery } from '@tanstack/react-query';
import { releasesApi } from '../services/releases';

export function useReleases() {
  return useQuery({
    queryKey: ['releases'],
    queryFn: releasesApi.list,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRelease(id: string) {
  return useQuery({
    queryKey: ['releases', id],
    queryFn: () => releasesApi.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkItems(id: string, type?: string) {
  return useQuery({
    queryKey: ['work-items', id, type],
    queryFn: () => releasesApi.getWorkItems(id, { type, limit: 500 }),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
