export type WorkItemType = 'user_story' | 'task' | 'bug' | 'feature';
export type ReleaseStatus = 'active' | 'completed';

export interface Release {
  id: string;
  version: string;
  name: string | null;
  status: ReleaseStatus;
  createdAt: number;
}

export interface ReleaseMetrics {
  releaseVersion: string;
  totalBugs: number;
  bugsByState: Record<string, number>;
  avgBugResolutionDays: number | null;
  releaseDurationDays: number | null;
  plannedHours: number;
  actualHours: number;
  effortVariancePercent: number | null;
  storyPoints: number;
}

export interface ImportResult {
  jobId: string;
  rowsImported: number;
  rowsSkipped: number;
  rowsFailed: number;
  errors: Array<{ row: number; message: string }>;
}

export interface ApiError {
  error: string;
}
