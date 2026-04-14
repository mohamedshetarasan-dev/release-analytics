# PRD: Release Analytics Tool

## Document Control

| Field | Value |
|---|---|
| Author | Product Manager |
| Date | 2026-04-14 |
| Version | 1.0 |
| Status | Draft |

---

## 1. Problem Statement

Release managers and engineering managers at Rasan currently track release health manually. After each release, they export work items from Azure DevOps into spreadsheets and manually calculate metrics such as bug counts, effort variance, and release duration. This process is:

- **Time-consuming**: Hours spent per release on calculations that should be automated
- **Inconsistent**: Different people use different formulas, leading to conflicting reports
- **Delayed**: Visibility into release quality arrives too late to act on
- **Not comparable**: There is no easy way to compare metrics across multiple releases

The Release Analytics tool eliminates this pain by automatically ingesting Azure DevOps exports and presenting key release health metrics in an interactive dashboard.

---

## 2. Objectives and Success Metrics

| Objective | KPI | Target |
|---|---|---|
| Eliminate manual calculation | Time to generate release report | < 5 minutes (from upload to dashboard) |
| Consistent metrics | Calculation accuracy | 100% match to source data |
| Cross-release visibility | Releases comparable in dashboard | Up to 5 releases side by side |
| Data ingestion reliability | Import success rate | ≥ 99% of valid rows imported correctly |
| Dashboard performance | Time to render charts after selection | < 2 seconds |

---

## 3. Scope

### Phase 1 — In Scope
- CSV and XLSX file import from Azure DevOps export
- Automatic release detection from `Release Version` column
- Parent inheritance for Bugs/Tasks with empty Release Version
- Four key metrics dashboards:
  - Bug Count per Release
  - Average Bug Resolution Time
  - Planned vs Actual Effort
  - Release Duration
- Multi-release comparison on all charts
- SQLite database (local, no infrastructure required)

### Phase 1 — Out of Scope
- Direct Azure DevOps API integration (Phase 2)
- User authentication and multi-tenancy
- Bug severity/priority analytics
- Effort breakdown by individual team member
- Arabic language UI
- Mobile-responsive UI (1024px minimum width)

### Phase 2 — Future
- Direct Azure DevOps REST API connection with PAT authentication
- Scheduled/automated data sync
- PostgreSQL migration for production scale
- Arabic language support
- Configurable SLA thresholds and effort variance alert levels

---

## 4. User Personas

### Release Manager
**Goal**: Quickly assess the health and completeness of a release without manual spreadsheet work.
**Key needs**: Import data easily, see bug count, understand release duration, share a clear report.

### Engineering Manager
**Goal**: Track team performance across releases — are we resolving bugs faster? Is our effort estimation improving?
**Key needs**: Compare metrics across releases, spot variance trends, identify underperforming sprints.

### QA Lead
**Goal**: Understand bug volume and resolution speed per release to plan testing resources.
**Key needs**: Bug count by state, resolution time trends, identify releases with high bug density.

---

## 5. User Stories (Epics)

### Epic 1: Data Import
- As a Release Manager, I can upload a `.csv` or `.xlsx` file so that my Azure DevOps data is automatically parsed and stored
- As a Release Manager, I see a clear import summary with row counts and any validation errors
- As a Release Manager, re-uploading the same file does not create duplicate records

### Epic 2: Bug Count Dashboard
- As an Engineering Manager, I can view the total number of bugs per release on a bar chart
- As an Engineering Manager, I can compare bug counts across multiple releases simultaneously
- As a QA Lead, I can see bugs broken down by state (Active, Resolved, Closed)

### Epic 3: Bug Resolution Time
- As a QA Lead, I can see the average bug resolution time per release
- As an Engineering Manager, I am alerted when the average resolution time exceeds the SLA threshold
- As an Engineering Manager, I can compare resolution time trends across releases

### Epic 4: Effort Tracking
- As an Engineering Manager, I can see planned vs actual effort (hours) per release
- As a Project Manager, I can see story point totals per release separately from hours
- As an Engineering Manager, I am alerted when actual effort exceeds planned by more than 10%

### Epic 5: Release Duration
- As a Release Manager, I can see how many calendar days each release took from start to finish
- As an Engineering Manager, I can compare release durations to an average reference line
- As a Release Manager, releases still in progress are clearly labelled

---

## 6. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | System accepts `.csv` and `.xlsx` files up to 10MB | Must |
| FR-02 | Import completes in under 10 seconds for 500 rows | Must |
| FR-03 | Releases auto-detected from `Release Version` column | Must |
| FR-04 | Bugs with empty Release Version inherit from parent User Story | Must |
| FR-05 | Per-row validation errors reported without aborting the whole import | Must |
| FR-06 | Duplicate imports are idempotent (upsert on azure_id) | Must |
| FR-07 | Bug count chart renders by state breakdown | Must |
| FR-08 | Avg bug resolution time = `Resolved Date - Activated Date` | Must |
| FR-09 | Effort chart shows planned hours vs actual hours (Tasks) | Must |
| FR-10 | Story points shown separately from hours | Must |
| FR-11 | Release duration = `MAX(closed_date) - MIN(activated_date)` | Must |
| FR-12 | All charts support multi-release comparison | Must |
| FR-13 | Variance > 10% highlighted in red on effort chart | Should |
| FR-14 | SLA breach (avg resolution > 5 days) highlighted in red | Should |
| FR-15 | Average duration reference line on release duration chart | Should |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard renders in < 2 seconds for up to 1,000 work items |
| Browser Support | Chrome, Firefox, Edge — latest 2 versions |
| Minimum Resolution | 1024px width |
| Data Integrity | Uploaded files deleted from server after processing |
| Test Coverage | Backend: 80%, Frontend: 70% |
| Accessibility | WCAG 2.1 AA for all interactive elements |

---

## 8. API Contract Summary

See `docs/api-spec.md` for full endpoint documentation.

Key endpoints:
- `POST /api/v1/uploads` — file import
- `GET /api/v1/releases` — list releases
- `GET /api/v1/releases/:id/metrics` — all metrics for a release
- `GET /api/v1/releases/:id/metrics/bugs` — bug count + resolution time
- `GET /api/v1/releases/:id/metrics/effort` — effort data
- `GET /api/v1/releases/compare?ids=a,b,c` — cross-release comparison

---

## 9. Data Model Summary

See `docs/development-plan.md` for full schema.

Key entities: `releases`, `work_items`, `import_jobs`

Key column mappings from Azure DevOps export:

| Azure DevOps Column | Internal Field | Notes |
|---|---|---|
| `Release Version` | `release_version` | Primary release key |
| `Original Estimate` | `planned_hours` | Tasks only |
| `Completed Work` | `actual_hours` | Tasks only |
| `Story Points` | `story_points` | User Stories only |
| `Activated Date` | `activated_date` | Start of work |
| `Resolved Date` | `resolved_date` | End of bug fix |

---

## 10. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Should "Closed" and "Resolved" bug states be shown separately or merged? | Product | Open |
| 2 | Should bugs "Closed without fix" be included in resolution time? | Product | Open |
| 3 | Should the 10% effort variance threshold be configurable? | Product | Open |
| 4 | Should release duration exclude weekends? | Product | Open |
| 5 | Should releases "In Progress" appear on the duration chart? | Product | Open |

---

## 11. Acceptance Criteria (Definition of Done)

For every outcome, the following must be true before it is considered complete:
- [ ] Unit tests pass with required coverage
- [ ] Code review approved (via Code Review Agent + human review)
- [ ] No console errors in production build
- [ ] Charts render correctly with edge case data (zero bugs, no resolved items, null dates)
- [ ] Import handles the confirmed Azure DevOps CSV format without errors
- [ ] All AI Inquiries in the relevant outcome document are resolved
