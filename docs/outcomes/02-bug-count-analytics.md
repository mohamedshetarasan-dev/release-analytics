# Bug Count Analytics per Release

## Problem Definition
- Release managers have no visual way to track how many bugs were found and resolved across releases
- Engineering managers and QA leads are affected
- Impact: quality trends are invisible, making it hard to improve release stability over time

## Scope of Implementation
[x] New Feature — first analytics chart in the Release Analytics dashboard

## Trigger
User opens the Dashboard page and selects one or more releases from the Release Selector

## Success Matrices
- Bug count chart renders in under 2 seconds after release selection
- Chart accurately reflects total, resolved, and active bug counts from the database
- Engineering managers can compare bug counts across at least 3 releases simultaneously
- Zero manual calculation required

## Description
The system calculates the total number of bugs per release, broken down by state (Resolved, Active, Closed, New). These counts are displayed as a grouped bar chart on the dashboard, one bar group per release. When multiple releases are selected, all groups appear side-by-side for comparison.

## Acceptance Criteria / Scenarios
- Single release selected → bar chart shows total bugs split by state (Resolved, Active, Closed)
- Multiple releases selected → grouped bars shown per release for comparison
- Release with zero bugs → shows zero-height bar (chart does not hide or skip it)
- Chart tooltip shows exact count on hover
- Chart legend is visible and correctly labelled

## In Scope
- Bug count per release (total)
- Breakdown by state: Resolved, Active, Closed, New
- Single-release and multi-release comparison
- Responsive chart (minimum 1024px width)

## Out of Scope
- Bug severity or priority breakdown (future enhancement)
- Bugs linked to specific user stories or features drill-down
- Export chart as image

## Edge Cases / Failure Modes
- Release has no bugs → chart still renders with zero values (no empty state hiding the chart)
- All bugs in one state → chart shows single-colour bar correctly
- Very large bug count (>500) → chart axis scales correctly without overflow

## Impacted Areas
- Dashboard page (frontend)
- `BugCountChart.tsx` component
- `GET /api/v1/releases/:id/metrics/bugs` endpoint
- `metricsService.ts` bug count query

## Constraints

### Business Constraints
- Only work items of type `Bug` are counted — Test Cases, Release Notes, Tasks are excluded

### Technical Constraints
- Chart must use Recharts `BarChart` with `ResponsiveContainer`
- Data fetched via React Query; cached for 5 minutes

## Assumptions
- Bug state values in the database match what Azure DevOps exports: Active, Resolved, Closed, New
- A "bug" is exclusively identified by `type = 'bug'` in the work_items table

## Suggested Slices
1. Backend metric query + API endpoint
2. Frontend chart with mock data
3. Connect chart to live API
4. Multi-release comparison mode

## Figma Design Link
TBD

## Translations
- Chart labels in English; Arabic deferred

## AI Inquiries
> **Rule: Must be resolved before execution begins.**

- Should "Closed" and "Resolved" be treated as the same state for display, or shown separately?
- Should the chart show bugs found in a release or bugs fixed in a release? (distinction matters if a bug was found in sprint 1 but fixed in sprint 2 of the same release)

## Dependencies / Links
- Depends on: Outcome 01 (Import Release Data) — data must exist in DB
- Depends on: `metricsService.ts`, `work_items` table
