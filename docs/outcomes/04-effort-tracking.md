# Effort Tracking — Planned vs Actual per Release

## Problem Definition
- Engineering managers cannot easily compare planned effort to actual effort spent per release, making sprint planning improvements impossible
- Project managers and engineering leads are affected
- Impact: chronic over- or under-estimation goes undetected and uncorrected, degrading forecast accuracy over time

## Scope of Implementation
[x] New Feature — third analytics metric in the dashboard

## Trigger
User opens the Dashboard page and selects one or more releases from the Release Selector

## Success Matrices
- Planned vs actual effort chart renders within 2 seconds of release selection
- Effort variance percentage calculated and displayed per release
- Releases where actual effort exceeded planned by more than 10% are visually flagged in red
- Both hours (Tasks) and story points (User Stories) are tracked and presented separately

## Description
The system sums `Original Estimate` (planned hours) and `Completed Work` (actual hours) for all Tasks in a release, and sums `Story Points` for all User Stories. These are displayed as a grouped bar chart (planned vs actual) per release, alongside a KPI card showing the variance percentage. When actual exceeds planned by more than 10%, the chart bars are highlighted in red.

## Acceptance Criteria / Scenarios
- Release selected → grouped bar chart shows planned hours vs actual hours
- Story points total is shown separately (different unit — not combined with hours)
- Variance % displayed: `((actual - planned) / planned) * 100`
- Variance > 10% → bars highlighted in red
- Tasks with no `Original Estimate` → excluded from planned total; their `Completed Work` still counts toward actual
- No tasks in release → metric shows "No effort data"
- Multi-release comparison → all selected releases shown side by side

## In Scope
- Planned effort (hours): SUM of `Original Estimate` for Tasks
- Actual effort (hours): SUM of `Completed Work` for Tasks
- Story points: SUM of `Story Points` for User Stories (displayed separately)
- Variance % calculation
- 10% threshold visual alert
- Multi-release comparison

## Out of Scope
- Effort breakdown by individual team member
- Effort by work item type breakdown chart
- Time tracking integration beyond Azure DevOps exports

## Edge Cases / Failure Modes
- All tasks have null `Original Estimate` → planned hours = 0; variance cannot be calculated → show "No planned data"
- Actual hours = 0 (no completed work logged) → show 0 actual; variance = -100%
- Story points null for all user stories → story points section shows "N/A"

## Impacted Areas
- Dashboard page (frontend)
- `EffortComparisonChart.tsx` component
- `MetricCard.tsx` (variance KPI card)
- `GET /api/v1/releases/:id/metrics/effort` endpoint
- `metricsService.ts` effort query

## Constraints

### Business Constraints
- Hours and story points must NOT be combined into a single number — they use different units

### Technical Constraints
- Tasks without `Original Estimate` are excluded from the planned sum but their `Completed Work` is included in actual sum
- User Stories contribute story points only, not hours

## Assumptions
- `Original Estimate` and `Completed Work` in the export are in hours (confirmed from sample data)
- Story Points are set on User Stories only; Tasks use hours

## Suggested Slices
1. Backend effort query (hours for tasks)
2. Backend story points query (for user stories)
3. Grouped bar chart frontend
4. Variance KPI card with 10% threshold alert
5. Multi-release comparison

## Figma Design Link
TBD

## Translations
- "hrs", "pts", "variance" labels in English; Arabic deferred

## AI Inquiries
> **Rule: Must be resolved before execution begins.**

- Should effort tracking include Feature-type work items or only User Story and Task?
- Is the 10% variance threshold a fixed business rule or should it be configurable per team?

## Dependencies / Links
- Depends on: Outcome 01 (Import Release Data)
- `work_items` table — `planned_hours`, `actual_hours`, `story_points` fields
