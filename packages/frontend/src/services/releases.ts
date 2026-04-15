import { api } from './api';
import type { Release, ReleaseMetrics, WorkItem } from '../types';

export const releasesApi = {
  list: () => api.get<Release[]>('/releases').then((r) => r.data),

  get: (id: string) => api.get<Release>(`/releases/${id}`).then((r) => r.data),

  getMetrics: (version: string) =>
    api.get<ReleaseMetrics>(`/releases/${version}/metrics`).then((r) => r.data),

  compare: (versions: string[]) =>
    api.get<ReleaseMetrics[]>(`/releases/compare?ids=${versions.join(',')}`).then((r) => r.data),

  getWorkItems: (id: string, params?: { type?: string; page?: number; limit?: number }) =>
    api.get<WorkItem[]>(`/releases/${id}/work-items`, { params }).then((r) => r.data),

  delete: (id: string) => api.delete(`/releases/${id}`),
};
