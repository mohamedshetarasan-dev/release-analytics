# Bug Resolution Time Analytics

## Problem Definition
- Teams have no visibility into how long bugs take to resolve, making it impossible to identify bottlenecks or set SLA targets
- QA leads and engineering managers are affected
- Impact: undetected slow resolution cycles reduce team velocity and release quality

## Scope of Implementation
[x] New Feature — second analytics metric in the dashboard

## Trigger
User opens the Dashboard page and selects a release from the Release Selector

## Success Matrices
- Average bug resolution time displayed accurately per release (in days, rounded to 1 decimal)
- Metric is visible within 2 seconds of release selection
- Teams can compare resolution time across releases to identify trends
- SLA breach (avg > 5 days) is visually highlighted on the chart and KPI card

## Description
The system calculates the average time (in days) from when a bug was `Activated` (work started) to when it was `Resolved`, for all resolved bugs in the selected release. This is displayed as a bar chart per release and as a KPI metric card. Bugs without a Resolved Date are excluded from the average. If Activated Date is null, Created Date is used as fallback.

## Acceptance Criteria / Scenarios
- Release selected → average resolution time in days displayed on metric card and chart
- Releases with no resolved bugs → metric card shows "N/A", chart bar is zero
- Avg resolution time > 5 days → metric card and chart bar highlighted in red (SLA breach)
- Resolution time calculated as `Resolved Date - Activated Date` (fallback: `Resolved Date - Created Date`)
- Unresolved bugs (no Resolved Date) are excluded from the calculation

## In Scope
- Average resolution time per release in calendar days
- SLA threshold indicator (default: 5 days)
- Per-release comparison bar chart
- Metric card on dashboard

## Out of Scope
- Per-bug resolution time breakdown (future)
- Resolution time by assignee
- Custom SLA thresholds per work item type
- Business days calculation (calendar days only in Phase 1)

## Edge Cases / Failure Modes
- Bug has `Resolved Date` earlier than `Activated Date` (data quality issue) → excluded from average, warning logged
- All bugs in the release are unresolved → metric shows "N/A"
- Resolved Date equals Activated Date (same-day fix) → resolution time = 0 days, shown as "< 1 day"

## Impacted Areas
- Dashboard page (frontend)
- `BugResolutionChart.tsx` component
- `MetricCard.tsx` (resolution time KPI card)
- `GET /api/v1/releases/:id/metrics/bugs` endpoint
- `metricsService.ts` resolution time query

## Constraints

### Business Constraints
- Resolution time must be calculated in calendar days (not business days) in Phase 1

### Technical Constraints
- Use `activated_date` as the start timestamp; fall back to `created_date` if null
- Exclude bugs where `resolved_date IS NULL`

## Assumptions
- `Activated Date` in the export represents when a developer began working on the bug (confirmed from sample data)
- Calendar days are sufficient for Phase 1 reporting

## Suggested Slices
1. Backend SQL query for avg resolution time
2. Metric card with SLA indicator
3. Per-release comparison chart
4. Configurable SLA threshold in Settings (future slice)

## Figma Design Link
TBD

## Translations
- "days" label in English; Arabic deferred

## AI Inquiries
> **Rule: Must be resolved before execution begins.**

- Should the SLA threshold (5 days) be hardcoded for Phase 1 or configurable at launch?
- Should bugs that are "Closed" without being "Resolved" (closed without fix) be included or excluded from resolution time calculation?

## Dependencies / Links
- Depends on: Outcome 01 (Import Release Data)
- Shares the metrics API endpoint with Outcome 02 (Bug Count Analytics)
