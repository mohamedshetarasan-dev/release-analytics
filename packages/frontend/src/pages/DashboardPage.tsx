import ReleaseSelector from '../components/shared/ReleaseSelector';
import MetricCard from '../components/shared/MetricCard';
import BugCountChart from '../components/charts/BugCountChart';
import BugResolutionChart from '../components/charts/BugResolutionChart';
import EffortComparisonChart from '../components/charts/EffortComparisonChart';
import ReleaseDurationChart from '../components/charts/ReleaseDurationChart';
import { useCompareMetrics } from '../hooks/useMetrics';
import { useAppStore } from '../store';

const SLA_DAYS = 5;

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <h3 style={{ margin: '0 0 16px', color: '#2d3748', fontSize: 15 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { selectedReleaseIds } = useAppStore();
  const { data: metrics, isLoading, error } = useCompareMetrics(selectedReleaseIds);

  const hasData = metrics && metrics.length > 0;

  // Aggregate KPIs across all selected releases
  const totalBugs = hasData ? metrics.reduce((s, m) => s + m.totalBugs, 0) : null;
  const avgResolution =
    hasData && metrics.some((m) => m.avgBugResolutionDays !== null)
      ? metrics
          .filter((m) => m.avgBugResolutionDays !== null)
          .reduce((s, m) => s + (m.avgBugResolutionDays ?? 0), 0) /
        metrics.filter((m) => m.avgBugResolutionDays !== null).length
      : null;
  const totalPlanned = hasData ? metrics.reduce((s, m) => s + m.plannedHours, 0) : null;
  const totalActual = hasData ? metrics.reduce((s, m) => s + m.actualHours, 0) : null;
  const effortVariance =
    totalPlanned && totalPlanned > 0
      ? parseFloat((((totalActual! - totalPlanned) / totalPlanned) * 100).toFixed(1))
      : null;

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', color: '#1F3864', fontSize: 22 }}>Dashboard</h1>
      <p style={{ color: '#718096', margin: '0 0 20px', fontSize: 14 }}>
        Select one or more releases to view metrics.
      </p>

      <div style={{ marginBottom: 24 }}>
        <ReleaseSelector />
      </div>

      {selectedReleaseIds.length === 0 && (
        <div
          style={{
            background: '#ebf8ff',
            border: '1px solid #bee3f8',
            borderRadius: 8,
            padding: '20px 24px',
            color: '#2c5282',
            fontSize: 14,
          }}
        >
          Select a release above to load its metrics.
        </div>
      )}

      {isLoading && (
        <div style={{ color: '#718096', fontSize: 14 }}>Loading metrics…</div>
      )}

      {error && (
        <div style={{ color: '#c53030', fontSize: 14 }}>Failed to load metrics.</div>
      )}

      {hasData && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <MetricCard label="Total Bugs" value={totalBugs} />
            <MetricCard
              label="Avg Bug Resolution"
              value={avgResolution !== null ? parseFloat(avgResolution.toFixed(1)) : null}
              unit="days"
              alert={avgResolution !== null && avgResolution > SLA_DAYS}
              subtitle={avgResolution !== null && avgResolution > SLA_DAYS ? `SLA breach (>${SLA_DAYS} days)` : undefined}
            />
            <MetricCard label="Planned Hours" value={totalPlanned} unit="hrs" />
            <MetricCard
              label="Actual Hours"
              value={totalActual}
              unit="hrs"
              alert={effortVariance !== null && effortVariance > 10}
              subtitle={effortVariance !== null ? `${effortVariance > 0 ? '+' : ''}${effortVariance}% vs planned` : undefined}
            />
            <MetricCard
              label="Story Points"
              value={hasData ? metrics.reduce((s, m) => s + m.storyPoints, 0) : null}
              unit="pts"
            />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 20 }}>
            <ChartSection title="Bug Count by State">
              <BugCountChart data={metrics} />
            </ChartSection>

            <ChartSection title="Avg Bug Resolution Time">
              <BugResolutionChart data={metrics} slaDays={SLA_DAYS} />
            </ChartSection>

            <ChartSection title="Planned vs Actual Effort">
              <EffortComparisonChart data={metrics} />
            </ChartSection>

            <ChartSection title="Release Duration">
              <ReleaseDurationChart data={metrics} />
            </ChartSection>
          </div>
        </>
      )}
    </div>
  );
}
