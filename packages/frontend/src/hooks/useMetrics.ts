import { useQuery } from '@tanstack/react-query';
import { releasesApi } from '../services/releases';

export function useMetrics(releaseId: string) {
  return useQuery({
    queryKey: ['metrics', releaseId],
    queryFn: () => releasesApi.getMetrics(releaseId),
    enabled: Boolean(releaseId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompareMetrics(releaseIds: string[]) {
  return useQuery({
    queryKey: ['metrics', 'compare', releaseIds],
    queryFn: () => releasesApi.compare(releaseIds),
    enabled: releaseIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
