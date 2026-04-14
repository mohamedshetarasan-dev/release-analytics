export type WorkItemType = 'user_story' | 'task' | 'bug' | 'feature';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ReleaseStatus = 'active' | 'completed';

export interface Release {
  id: string;
  version: string;
  name: string | null;
  status: ReleaseStatus;
  importJobId: string | null;
  createdAt: number;
}

export interface WorkItem {
  id: string;
  azureId: string;
  releaseVersion: string | null;
  parentAzureId: string | null;
  type: WorkItemType;
  title: string;
  state: string;
  assignedTo: string | null;
  tags: string | null;
  createdDate: number | null;
  activatedDate: number | null;
  resolvedDate: number | null;
  closedDate: number | null;
  iterationPath: string | null;
  plannedHours: number | null;
  actualHours: number | null;
  storyPoints: number | null;
}

export interface ImportJob {
  id: string;
  filename: string;
  status: ImportStatus;
  rowCount: number | null;
  rowsImported: number | null;
  rowsSkipped: number | null;
  rowsFailed: number | null;
  errorMessage: string | null;
  createdAt: number;
  completedAt: number | null;
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
