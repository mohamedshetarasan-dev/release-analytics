import { v4 as uuidv4 } from 'uuid';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import { z } from 'zod';
import fs from 'fs';
import { eq } from 'drizzle-orm';
import { getDb } from '../config/database';
import { workItems, releases, importJobs } from '../db/schema';
import { COLUMN_MAP, SKIP_TYPES, normaliseType, extractName } from '../config/columnMap';
import type { ImportResult } from '../types';

// ---------------------------------------------------------------------------
// Raw row Zod schema — all fields optional at parse time; validated below
// ---------------------------------------------------------------------------
const RawRowSchema = z.object({
  azure_id:        z.union([z.string(), z.number()]).transform(String),
  type:            z.string(),
  parent_id:       z.union([z.string(), z.number(), z.null(), z.undefined()]).optional().transform((v) => (v != null ? String(v) : null)),
  title:           z.string().min(1, 'Title is required'),
  assigned_to:     z.string().nullish().default(null),
  state:           z.string().min(1, 'State is required'),
  tags:            z.string().nullish().default(null),
  release_version: z.string().nullish().default(null),
  created_date:    z.string().nullish().default(null),
  activated_date:  z.string().nullish().default(null),
  resolved_date:   z.string().nullish().default(null),
  closed_date:     z.string().nullish().default(null),
  iteration_path:  z.string().nullish().default(null),
  planned_hours:   z.union([z.string(), z.number()]).nullish().transform(toFloat),
  actual_hours:    z.union([z.string(), z.number()]).nullish().transform(toFloat),
  story_points:    z.union([z.string(), z.number()]).nullish().transform(toFloat),
});

type RawRow = z.infer<typeof RawRowSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toFloat(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function toTimestamp(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Build a mapping from header column name → field key using COLUMN_MAP.
 */
function buildHeaderIndex(headers: string[]): Record<string, keyof typeof COLUMN_MAP> {
  const index: Record<string, keyof typeof COLUMN_MAP> = {};
  for (const [field, synonyms] of Object.entries(COLUMN_MAP)) {
    for (const syn of synonyms as readonly string[]) {
      const normalised = syn.toLowerCase().trim();
      const matched = headers.find((h) => h.toLowerCase().trim() === normalised);
      if (matched) {
        index[matched] = field as keyof typeof COLUMN_MAP;
        break;
      }
    }
  }
  return index;
}

/** Convert a raw spreadsheet row into a normalised object keyed by our field names */
function mapRow(
  raw: Record<string, unknown>,
  headerIndex: Record<string, keyof typeof COLUMN_MAP>,
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [header, fieldKey] of Object.entries(headerIndex)) {
    mapped[fieldKey] = raw[header] ?? null;
  }
  return mapped;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------
function parseXlsx(filePath: string): Record<string, unknown>[] {
  const buf = fs.readFileSync(filePath);
  const wb = xlsxRead(buf, { type: 'buffer', cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsxUtils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, raw: false });
}

function parseCsv(filePath: string): Record<string, unknown>[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return csvParse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: false,
  }) as Record<string, unknown>[];
}

// ---------------------------------------------------------------------------
// Core import pipeline
// ---------------------------------------------------------------------------
export async function runImport(
  filePath: string,
  filename: string,
): Promise<ImportResult> {
  const db = getDb();
  const jobId = uuidv4();
  const now = Date.now();

  // Create import job record
  await db.insert(importJobs).values({
    id:        jobId,
    filename,
    status:    'processing',
    createdAt: now,
  }).run();

  let rowsImported = 0;
  let rowsSkipped  = 0;
  let rowsFailed   = 0;
  const errors: ImportResult['errors'] = [];

  try {
    // 1. Parse file
    const ext = filename.toLowerCase().split('.').pop();
    const rawRows = ext === 'csv' ? parseCsv(filePath) : parseXlsx(filePath);

    if (rawRows.length === 0) {
      return finaliseJob(db, jobId, { jobId, rowsImported: 0, rowsSkipped: 0, rowsFailed: 0, errors: [] }, 'completed');
    }

    // 2. Build header index from first row keys
    const headers = Object.keys(rawRows[0]);
    const headerIndex = buildHeaderIndex(headers);

    // 3. Validate mandatory columns
    const missingMandatory: string[] = [];
    for (const mandatory of ['azure_id', 'type', 'title', 'state'] as const) {
      if (!Object.values(headerIndex).includes(mandatory)) {
        missingMandatory.push(COLUMN_MAP[mandatory][0]);
      }
    }
    if (missingMandatory.length) {
      throw new Error(`Missing mandatory columns: ${missingMandatory.join(', ')}`);
    }

    // 4. First pass — validate, normalise, and collect valid rows
    const validRows: RawRow[] = [];
    const releaseVersionsEncountered = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const rowNum = i + 2; // 1-indexed + header row
      const mapped = mapRow(rawRows[i], headerIndex);
      const rawType = String(mapped.type ?? '');

      // Skip unwanted types silently
      if (SKIP_TYPES.has(rawType)) {
        rowsSkipped++;
        continue;
      }

      const parsed = RawRowSchema.safeParse(mapped);
      if (!parsed.success) {
        rowsFailed++;
        const msg = parsed.error.errors.map((e) => e.message).join('; ');
        errors.push({ row: rowNum, message: msg });
        continue;
      }

      const normType = normaliseType(parsed.data.type);
      if (!normType) {
        rowsSkipped++;
        continue;
      }

      const row = { ...parsed.data, type: normType } as unknown as RawRow;
      validRows.push(row);

      if (row.release_version) {
        releaseVersionsEncountered.add(row.release_version);
      }
    }

    // 5. Second pass — resolve release_version via parent inheritance
    const releaseByAzureId = new Map<string, string>();
    for (const row of validRows) {
      if (row.release_version) {
        releaseByAzureId.set(row.azure_id, row.release_version);
      }
    }

    let changed = true;
    let safetyCounter = 0;
    while (changed && safetyCounter < 10) {
      changed = false;
      safetyCounter++;
      for (const row of validRows) {
        if (!row.release_version && row.parent_id) {
          const parentVersion = releaseByAzureId.get(row.parent_id);
          if (parentVersion) {
            row.release_version = parentVersion;
            releaseByAzureId.set(row.azure_id, parentVersion);
            releaseVersionsEncountered.add(parentVersion);
            changed = true;
          }
        }
      }
    }

    // Items still without a release_version are flagged
    const unresolvedRows = validRows.filter((r) => !r.release_version);
    if (unresolvedRows.length) {
      for (const r of unresolvedRows) {
        errors.push({ row: -1, message: `Work item ${r.azure_id} "${r.title}" has no Release Version and could not inherit from parent` });
      }
    }

    // 6. Upsert releases for every version we found
    for (const version of releaseVersionsEncountered) {
      const existing = await db.select().from(releases).where(eq(releases.version, version)).get();
      if (!existing) {
        await db.insert(releases).values({
          id:          uuidv4(),
          version,
          status:      'active',
          importJobId: jobId,
          createdAt:   now,
        }).run();
      }
    }

    // 7. Upsert work items in a transaction
    const importableRows = validRows.filter((r) => r.release_version);

    for (const row of importableRows) {
      const existingItem = await db
        .select({ id: workItems.id })
        .from(workItems)
        .where(eq(workItems.azureId, row.azure_id))
        .get();

      const itemData = {
        azureId:        row.azure_id,
        releaseVersion: row.release_version ?? null,
        parentAzureId:  row.parent_id ?? null,
        type:           row.type as 'user_story' | 'task' | 'bug' | 'feature',
        title:          row.title,
        state:          row.state,
        assignedTo:     extractName(row.assigned_to),
        tags:           row.tags ?? null,
        createdDate:    toTimestamp(row.created_date),
        activatedDate:  toTimestamp(row.activated_date),
        resolvedDate:   toTimestamp(row.resolved_date),
        closedDate:     toTimestamp(row.closed_date),
        iterationPath:  row.iteration_path ?? null,
        plannedHours:   row.planned_hours ?? null,
        actualHours:    row.actual_hours ?? null,
        storyPoints:    row.story_points ?? null,
      };

      if (existingItem) {
        await db.update(workItems).set(itemData).where(eq(workItems.azureId, row.azure_id)).run();
      } else {
        await db.insert(workItems).values({ id: uuidv4(), ...itemData }).run();
      }
    }

    // All importable rows count as imported (inserts or updates)
    rowsImported = importableRows.length;

    const result: ImportResult = { jobId, rowsImported, rowsSkipped, rowsFailed, errors };
    return finaliseJob(db, jobId, result, 'completed');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.update(importJobs)
      .set({ status: 'failed', errorMessage: message, completedAt: Date.now() })
      .where(eq(importJobs.id, jobId))
      .run();
    throw err;
  } finally {
    // Always clean up tmp file
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }
}

async function finaliseJob(
  db: ReturnType<typeof getDb>,
  jobId: string,
  result: ImportResult,
  status: 'completed' | 'failed',
): Promise<ImportResult> {
  await db.update(importJobs)
    .set({
      status,
      rowCount:     result.rowsImported + result.rowsSkipped + result.rowsFailed,
      rowsImported: result.rowsImported,
      rowsSkipped:  result.rowsSkipped,
      rowsFailed:   result.rowsFailed,
      completedAt:  Date.now(),
    })
    .where(eq(importJobs.id, jobId))
    .run();
  return result;
}

/** Get import job status by ID */
export async function getImportJob(jobId: string) {
  return (await getDb().select().from(importJobs).where(eq(importJobs.id, jobId)).get()) ?? null;
}
