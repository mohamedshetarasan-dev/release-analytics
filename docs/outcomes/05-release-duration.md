# Release Duration Tracking

## Problem Definition
- There is no automated way to see how long each release took from start to finish, making capacity planning and release cadence analysis manual and inconsistent
- Release managers and engineering managers are affected
- Impact: inability to forecast future releases or identify releases that took significantly longer than expected

## Scope of Implementation
[x] New Feature — fourth analytics metric in the dashboard

## Trigger
User opens the Dashboard page and selects one or more releases from the Release Selector

## Success Matrices
- Release duration displayed in calendar days per release within 2 seconds
- Multiple releases can be compared side by side on a single chart
- Average release duration across all releases shown as a reference line
- "In Progress" releases (no closed date) are clearly labelled as such

## Description
The system calculates the total duration of each release as the difference between the earliest `Activated Date` and the latest `Closed Date` across all work items in that release. This is displayed as a horizontal bar chart per release, with an average reference line overlaid. A KPI card shows the duration of the selected release.

## Acceptance Criteria / Scenarios
- Release selected → duration in calendar days displayed on KPI card and chart
- Multi-release selected → horizontal bar chart shows all releases sorted by start date
- Average duration reference line overlaid on chart
- Release where all items have null `Closed Date` → shown as "In Progress" with start date only
- Duration formula: `MAX(closed_date) - MIN(activated_date)` across all work items in the release

## In Scope
- Duration per release in calendar days
- Multi-release comparison horizontal bar chart
- Average duration reference line
- "In Progress" state for releases without a fully closed date set

## Out of Scope
- Sprint-level duration breakdown within a release
- Working/business days calculation (calendar days only in Phase 1)
- Release timeline Gantt view

## Edge Cases / Failure Modes
- All work items have null `Activated Date` → fall back to `MIN(created_date)`
- Some items closed, some still open → calculate using available closed dates, mark release as "Partially Closed"
- Only one work item in a release → duration = that item's `closed_date - activated_date`

## Impacted Areas
- Dashboard page (frontend)
- `ReleaseDurationChart.tsx` component
- `MetricCard.tsx` (duration KPI card)
- `GET /api/v1/releases/:id/metrics` endpoint
- `metricsService.ts` duration query

## Constraints

### Business Constraints
- Duration must be expressed in calendar days for Phase 1

### Technical Constraints
- Use `MIN(activated_date)` as release start; fall back to `MIN(created_date)` if all activated dates are null
- Use `MAX(closed_date)` as release end

## Assumptions
- A release spans from the earliest activation of any work item to the latest closure
- Calendar days (including weekends) are sufficient for Phase 1 reporting

## Suggested Slices
1. Backend duration query + API endpoint
2. KPI metric card rendering
3. Horizontal bar chart with average reference line
4. Multi-release comparison mode

## Figma Design Link
TBD

## Translations
- "days" label in English; Arabic deferred

## AI Inquiries
> **Rule: Must be resolved before execution begins.**

- Should the release duration include weekends, or should only business days be counted? (Currently assumed: calendar days including weekends)
- Should releases still "In Progress" (no closed date on any item) appear on the duration chart?

## Dependencies / Links
- Depends on: Outcome 01 (Import Release Data)
- `work_items` table — `activated_date`, `closed_date` fields
