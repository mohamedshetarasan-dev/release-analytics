# Development Plan: Release Analytics Tool

## Overview

| Field | Value |
|---|---|
| Repository | `mohamedshetarasan-dev/release-analytics` |
| Created | 2026-04-14 |
| Stack | Node.js + Express + TypeScript (backend), React + TypeScript + Vite (frontend) |
| Database | SQLite (Phase 1) → PostgreSQL (Phase 2) |
| Agents | Anthropic Claude SDK (`claude-sonnet-4-6`) |
| Monorepo | npm workspaces + Turborepo |

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast DX, component-based, TS-first |
| Charts | Recharts | React-native, composable, responsive |
| State | Zustand + React Query | UI state + server state separation |
| Backend | Node.js + Express + TypeScript | Strong ecosystem, familiar JS stack |
| ORM | Drizzle ORM | SQL-first, lightweight, easy SQLite→Postgres migration |
| DB Phase 1 | SQLite (`better-sqlite3`) | Zero infra, runs in-process |
| DB Phase 2 | PostgreSQL | Production scale |
| File parsing | SheetJS (`xlsx`) + `csv-parse` | Handles both XLSX and CSV |
| File upload | Multer | Multipart form handling |
| Validation | Zod | Runtime schema validation |
| Agents | `@anthropic-ai/sdk` | Multi-agent orchestration |
| GitHub API | `@octokit/rest` | PR creation, comments |
| CI/CD | GitHub Actions | Lint, test, build, agent automation |

---

## Repository Structure

```
release-analytics/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + test + build on every PR
│       ├── pr-automation.yml         # Code Review Agent on PR open
│       └── deploy.yml                # Build + deploy on merge to main
├── packages/
│   ├── frontend/                     # React + TypeScript SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── charts/
│   │   │   │   │   ├── BugCountChart.tsx
│   │   │   │   │   ├── BugResolutionChart.tsx
│   │   │   │   │   ├── EffortComparisonChart.tsx
│   │   │   │   │   └── ReleaseDurationChart.tsx
│   │   │   │   ├── layout/
│   │   │   │   │   ├── AppShell.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── Header.tsx
│   │   │   │   ├── upload/
│   │   │   │   │   ├── FileUploader.tsx
│   │   │   │   │   └── UploadProgress.tsx
│   │   │   │   └── shared/
│   │   │   │       ├── MetricCard.tsx
│   │   │   │       ├── ReleaseSelector.tsx
│   │   │   │       └── DataTable.tsx
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── ImportPage.tsx
│   │   │   │   ├── ReleasesPage.tsx
│   │   │   │   └── SettingsPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useReleaseData.ts
│   │   │   │   ├── useUpload.ts
│   │   │   │   └── useMetrics.ts
│   │   │   ├── services/
│   │   │   │   ├── api.ts
│   │   │   │   ├── releases.ts
│   │   │   │   └── uploads.ts
│   │   │   ├── store/
│   │   │   │   ├── index.ts
│   │   │   │   ├── releaseSlice.ts
│   │   │   │   └── uiSlice.ts
│   │   │   ├── types/index.ts
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── tests/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.ts
│   │   │   │   ├── columnMap.ts      # Azure DevOps column mappings
│   │   │   │   └── env.ts
│   │   │   ├── db/
│   │   │   │   ├── migrations/
│   │   │   │   └── schema.ts         # Drizzle ORM schema
│   │   │   ├── routes/
│   │   │   │   ├── releases.ts
│   │   │   │   ├── metrics.ts
│   │   │   │   ├── uploads.ts
│   │   │   │   └── workItems.ts
│   │   │   ├── services/
│   │   │   │   ├── importService.ts  # CSV/XLSX parsing pipeline
│   │   │   │   ├── metricsService.ts # Metric calculations
│   │   │   │   └── releaseService.ts
│   │   │   ├── middleware/
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── requestLogger.ts
│   │   │   │   └── upload.ts
│   │   │   ├── types/index.ts
│   │   │   └── app.ts
│   │   ├── tests/
│   │   │   ├── fixtures/sample-export.csv
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── agents/
│       ├── src/
│       │   ├── orchestrator/
│       │   ├── agents/
│       │   │   ├── productManager.ts
│       │   │   ├── developer.ts
│       │   │   ├── codeReview.ts
│       │   │   └── testing.ts
│       │   ├── tools/
│       │   │   ├── githubTools.ts
│       │   │   ├── fileTools.ts
│       │   │   └── testRunnerTools.ts
│       │   └── shared/
│       │       ├── anthropicClient.ts
│       │       ├── types.ts
│       │       └── memory.ts
│       ├── tests/
│       ├── tsconfig.json
│       └── package.json
│
├── docs/
│   ├── PRD.md
│   ├── development-plan.md
│   ├── api-spec.md
│   └── outcomes/
│       ├── 01-import-release-data.md
│       ├── 02-bug-count-analytics.md
│       ├── 03-bug-resolution-time.md
│       ├── 04-effort-tracking.md
│       └── 05-release-duration.md
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── turbo.json
├── package.json
└── README.md
```

---

## Data Model

### `releases`
```sql
id              TEXT PRIMARY KEY       -- UUID
version         TEXT UNIQUE NOT NULL   -- "3.20.1", "4.2.0"
name            TEXT                   -- optional friendly name
status          TEXT NOT NULL          -- "active" | "completed"
import_job_id   TEXT REFERENCES import_jobs(id)
created_at      INTEGER NOT NULL       -- Unix timestamp
```

### `work_items`
```sql
id              TEXT PRIMARY KEY       -- UUID
azure_id        TEXT UNIQUE NOT NULL   -- original Azure DevOps ID
release_version TEXT                   -- FK to releases.version
parent_azure_id TEXT                   -- for parent inheritance
type            TEXT NOT NULL          -- "user_story" | "task" | "bug" | "feature"
title           TEXT NOT NULL
state           TEXT NOT NULL          -- "Active" | "Resolved" | "Closed" | "New"
assigned_to     TEXT                   -- name only (email stripped)
tags            TEXT                   -- semicolon-separated
created_date    INTEGER                -- Unix timestamp
activated_date  INTEGER                -- Unix timestamp (when work started)
resolved_date   INTEGER                -- Unix timestamp
closed_date     INTEGER                -- Unix timestamp
iteration_path  TEXT                   -- sprint path
planned_hours   REAL                   -- Original Estimate (Tasks)
actual_hours    REAL                   -- Completed Work (Tasks)
story_points    REAL                   -- Story Points (User Stories)
```

### `import_jobs`
```sql
id              TEXT PRIMARY KEY       -- UUID
filename        TEXT NOT NULL
status          TEXT NOT NULL          -- "pending" | "processing" | "completed" | "failed"
row_count       INTEGER
rows_imported   INTEGER
rows_skipped    INTEGER
rows_failed     INTEGER
error_message   TEXT
created_at      INTEGER NOT NULL
completed_at    INTEGER
```

---

## Column Map (Azure DevOps → Internal)

```typescript
// packages/backend/src/config/columnMap.ts
export const COLUMN_MAP = {
  azure_id:        ['ID'],
  type:            ['Work Item Type'],
  parent_id:       ['Parent'],
  title:           ['Title'],
  assigned_to:     ['Assigned To'],       // "Name <email>" → name only
  state:           ['State'],
  tags:            ['Tags'],
  release_version: ['Release Version'],   // PRIMARY release key
  created_date:    ['Created Date'],
  activated_date:  ['Activated Date'],
  resolved_date:   ['Resolved Date'],
  closed_date:     ['Closed Date'],
  iteration_path:  ['Iteration Path'],
  planned_hours:   ['Original Estimate'],
  actual_hours:    ['Completed Work'],
  story_points:    ['Story Points'],
} as const;

export const SKIP_TYPES = ['Test Case', 'Release Note'];
```

---

## Metric Calculations

| Metric | Formula |
|---|---|
| Total bugs | `COUNT(*) WHERE type='bug' AND release_version=X` |
| Avg resolution time | `AVG(resolved_date - activated_date) WHERE type='bug' AND resolved_date IS NOT NULL` — fallback: `resolved_date - created_date` if `activated_date` IS NULL |
| Release duration | `MAX(closed_date) - MIN(activated_date)` across all items — fallback start: `MIN(created_date)` |
| Planned hours | `SUM(planned_hours) WHERE type='task'` |
| Actual hours | `SUM(actual_hours) WHERE type='task'` |
| Story points | `SUM(story_points) WHERE type='user_story'` |

---

## Multi-Agent System

### Agents and Responsibilities

| Agent | Trigger | Responsibilities | Tools |
|---|---|---|---|
| Product Manager | Manual CLI / issue created | Write outcome docs, PRD sections | `write_file`, `read_file`, `create_github_issue` |
| Developer | Manual CLI / after outcome approved | Scaffold code, open PR | `read_file`, `write_file`, `create_pull_request`, `run_tests` |
| Code Review | PR opened (GitHub Actions) | Review diff, post comments | `read_file`, `list_files_changed`, `add_pr_comment` |
| Testing | Manual CLI / after merge | Write Jest tests, run, report | `read_file`, `write_file`, `run_tests` |

### Orchestrator Flow
```
Task received → router.ts determines agent(s) → agent executes with tools
→ results stored in shared memory → next agent receives context
→ final status posted to GitHub PR comment
```

### Anthropic Client
All agents share a single `anthropicClient.ts` with prompt caching enabled (`cache_control: { type: "ephemeral" }`) on system prompts to reduce token costs.

---

## Testing Strategy

| Package | Unit Coverage | Integration |
|---|---|---|
| backend | 80% lines/branches | Key API routes via supertest |
| frontend | 70% lines | Critical flows via vitest + RTL + msw |
| agents | 60% lines | Anthropic SDK mocked |

Backend tests use `better-sqlite3` in `:memory:` mode — no Docker required.

---

## GitHub Actions

| Workflow | Trigger | Jobs |
|---|---|---|
| `ci.yml` | PR to main | lint, type-check, test-backend, test-frontend, build |
| `pr-automation.yml` | PR opened/sync | Code Review Agent posts review |
| `deploy.yml` | Push to main | Build + deploy |

---

## Development Phases

### Phase 0 — Foundation
- GitHub repo creation and branch protection
- Monorepo scaffold (Turborepo + npm workspaces)
- ESLint, Prettier, TypeScript config
- GitHub Actions CI skeleton
- docs/ folder with all documents

### Phase 1 — Backend Core
- Drizzle ORM + SQLite setup
- `importService.ts`: CSV/XLSX parsing, column mapping, two-pass release resolution
- `metricsService.ts`: all 4 metric queries
- `releaseService.ts`: CRUD
- All REST API routes
- 80% unit test coverage + integration tests

### Phase 2 — Frontend Core
- Vite + React + TypeScript
- FileUploader + ImportPage
- DashboardPage with ReleaseSelector
- 4 chart components (Recharts)
- MetricCard, DataTable
- React Query + Axios
- Component tests (vitest + RTL + msw)

### Phase 3 — Multi-Agent System
- Anthropic SDK + prompt caching
- All 4 agents + orchestrator
- GitHub tools (Octokit)
- pr-automation.yml wired to Code Review Agent

### Phase 4 — Polish
- Error boundaries, loading states
- Accessibility audit
- README, api-spec.md
- Deploy workflow

### Phase 5 — Azure DevOps API (Future)
- Direct REST API connection with PAT auth
- Scheduled sync
- PostgreSQL migration
