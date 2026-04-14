/**
 * Maps internal field names to Azure DevOps CSV export column names.
 * Arrays allow fallback synonyms for column name variations across projects.
 */
export const COLUMN_MAP = {
  azure_id:        ['ID'],
  type:            ['Work Item Type'],
  parent_id:       ['Parent'],
  title:           ['Title'],
  assigned_to:     ['Assigned To'],       // format: "Name <email>" — extract name only
  state:           ['State'],
  tags:            ['Tags'],
  release_version: ['Release Version'],   // PRIMARY release key (e.g. "3.20.1", "4.2.0")
  created_date:    ['Created Date'],
  activated_date:  ['Activated Date'],    // when work actually started
  resolved_date:   ['Resolved Date'],
  closed_date:     ['Closed Date'],
  iteration_path:  ['Iteration Path'],    // sprint path
  planned_hours:   ['Original Estimate'], // hours; Tasks use this
  actual_hours:    ['Completed Work'],    // hours; Tasks use this
  story_points:    ['Story Points'],      // User Stories use this
} as const;

/** Work item types to skip entirely — not relevant for release metrics */
export const SKIP_TYPES = new Set(['Test Case', 'Release Note']);

/** Normalise Work Item Type string to internal enum value */
export function normaliseType(raw: string): string | null {
  const map: Record<string, string> = {
    'User Story': 'user_story',
    'Task': 'task',
    'Bug': 'bug',
    'Feature': 'feature',
  };
  return map[raw] ?? null;
}

/** Extract name from "Name <email@domain.com>" format */
export function extractName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/^(.+?)\s*<[^>]+>$/);
  return match ? match[1].trim() : raw.trim();
}
