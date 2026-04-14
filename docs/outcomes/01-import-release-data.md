# Import Release Data from Azure DevOps Export

## Problem Definition
- Release managers manually export work items from Azure DevOps and spend significant time calculating release statistics by hand in spreadsheets
- All team members who track release health are affected
- The impact is wasted time, inconsistent reporting, and delayed visibility into release quality

## Scope of Implementation
[x] Enhancement — builds a new data ingestion capability into the Release Analytics platform

## Trigger
User navigates to the Import page and selects or drags a `.csv` or `.xlsx` file exported from Azure DevOps

## Success Matrices
- Import of a 500-row CSV completes in under 10 seconds
- 100% of work item types (User Story, Task, Bug, Feature) are correctly categorised
- Release Version is correctly detected from the `Release Version` column and via parent inheritance for Bugs/Tasks with empty Release Version
- Zero manual data entry required after upload
- Validation errors surfaced to user in real-time with row-level detail

## Description
The system accepts a CSV or Excel file exported from Azure DevOps, parses all work items, maps them to their release version (directly or via parent inheritance for Bugs), and stores them in the database. Test Cases and Release Notes are silently skipped. The user sees a summary of what was imported, what was skipped, and any validation errors — then is redirected to the dashboard.

## Acceptance Criteria / Scenarios
- User uploads a valid CSV → all User Stories, Tasks, Bugs, Features are imported and grouped by Release Version
- Bugs with empty Release Version inherit the Release Version of their parent User Story
- User uploads a file with invalid rows → valid rows import successfully, invalid rows are reported per-row without aborting the whole import
- User uploads a non-CSV/XLSX file → system rejects it with a clear error before upload
- File larger than 10MB is rejected with a clear size error
- Duplicate upload of the same file (same azure_id values) upserts without creating duplicates
- `Assigned To` field is stored as name only (email stripped from `"Name <email>"` format)

## In Scope
- CSV and XLSX file formats
- Work item types: User Story, Task, Bug, Feature
- Release detection via `Release Version` column
- Parent inheritance for Bugs with empty Release Version
- Two-pass import (first pass: all items; second pass: resolve inherited releases)
- Per-row validation errors surfaced in UI
- Duplicate upsert — re-import same file is idempotent

## Out of Scope
- Direct Azure DevOps API connection (Phase 2)
- Editing or correcting individual work items after import
- Support for other export formats (JSON, XML)

## Edge Cases / Failure Modes
- Bug whose parent is also missing a Release Version → flagged as unresolved, reported to user, not imported
- CSV with unexpected column names → columnMap fallback synonyms attempted; if still unresolvable, report which column could not be mapped
- Empty file or file with header only → reported as "no importable rows found"
- Date fields in unexpected formats → Zod coerces where possible; reports error row if unparseable

## Impacted Areas
- Import page (frontend)
- Upload API endpoint (`POST /api/v1/uploads`)
- `importService.ts` (backend parsing pipeline)
- `releaseService.ts` (release auto-creation)
- `work_items` and `releases` database tables

## Constraints

### Business Constraints
- Must not store uploaded files permanently — delete from `/tmp/` after processing

### Technical Constraints
- Max file size: 10MB
- Must support both `.csv` (current export format) and `.xlsx` (future/legacy)
- Column names must match Azure DevOps export format exactly as confirmed in sample data

## Assumptions
- The `Release Version` column in Azure DevOps export is populated for User Stories
- Every Bug has a parent User Story (confirmed from sample data)
- Azure DevOps exports retain the same column structure across projects in the organisation

## Suggested Slices
1. CSV parsing + column mapping + DB upsert (no UI)
2. XLSX support added alongside CSV
3. Import UI with drag-and-drop and progress indicator
4. Per-row error reporting in UI
5. Duplicate/re-import handling

## Figma Design Link
TBD

## Translations
- All user-facing error messages in English
- Arabic translations deferred to a future release

## AI Inquiries
> **Rule: Must be resolved before execution begins.**

- What should happen when a Bug's parent is not present in the same file? (Assumed: flag as warning, not hard error — to be confirmed)
- Should re-importing the same release replace all existing work items or merge/upsert?

## Dependencies / Links
- Depends on: database schema (`releases`, `work_items`, `import_jobs` tables)
- Depended on by: all dashboard metrics outcomes (02, 03, 04, 05)
