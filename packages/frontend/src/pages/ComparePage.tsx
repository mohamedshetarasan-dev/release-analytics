import { useState } from 'react';
import { useReleases } from '../hooks/useReleaseData';
import { useCompareMetrics } from '../hooks/useMetrics';
import MetricCard from '../components/shared/MetricCard';
import BugCountChart from '../components/charts/BugCountChart';
import BugResolutionChart from '../components/charts/BugResolutionChart';
import EffortComparisonChart from '../components/charts/EffortComparisonChart';
import ReleaseDurationChart from '../components/charts/ReleaseDurationChart';
import TrendCorrelationChart from '../components/charts/TrendCorrelationChart';
import ReleaseDetailPanel from '../components/shared/ReleaseDetailPanel';
import type { Release } from '../types';

const SLA_DAYS = 5;

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
      padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ margin: '0 0 16px', color: '#2d3748', fontSize: 15 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function ComparePage() {
  const { data: releases, isLoading: releasesLoading } = useReleases();
  const [selected, setSelected] = useState<string[]>([]);
  const [detailRelease, setDetailRelease] = useState<Release | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const selectAll = () => setSelected((releases ?? []).map((r) => r.id));
  const clearAll  = () => setSelected([]);

  const { data: metrics, isLoading: metricsLoading } = useCompareMetrics(selected);
  const hasData = metrics && metrics.length > 0;

  const totalBugs    = hasData ? metrics.reduce((s, m) => s + m.totalBugs, 0) : null;
  const totalPlanned = hasData ? metrics.reduce((s, m) => s + m.plannedHours, 0) : null;
  const totalActual  = hasData ? metrics.reduce((s, m) => s + m.actualHours, 0) : null;
  const avgRes =
    hasData && metrics.some((m) => m.avgBugResolutionDays !== null)
      ? metrics.filter((m) => m.avgBugResolutionDays !== null)
          .reduce((s, m) => s + m.avgBugResolutionDays!, 0) /
        metrics.filter((m) => m.avgBugResolutionDays !== null).length
      : null;
  const effortVariance =
    totalPlanned && totalPlanned > 0
      ? parseFloat((((totalActual! - totalPlanned) / totalPlanned) * 100).toFixed(1))
      : null;

  const selectedReleaseObjects = (releases ?? []).filter((r) => selected.includes(r.id));

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', color: '#1F3864', fontSize: 22 }}>Compare Releases</h1>
      <p style={{ color: '#718096', margin: '0 0 20px', fontSize: 14 }}>
        Select two or more releases to compare them side-by-side across all metrics.
      </p>

      {/* Release picker */}
      {releasesLoading ? (
        <div style={{ color: '#718096', fontSize: 14 }}>Loading releases…</div>
      ) : !releases || releases.length === 0 ? (
        <div style={{
          background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 8,
          padding: '20px 24px', color: '#2c5282', fontSize: 14,
        }}>
          No releases found. <a href="/import" style={{ color: '#3182ce', fontWeight: 600 }}>Import data first.</a>
        </div>
      ) : (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
          padding: '16px 20px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select releases to compare
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              onClick={selected.length === releases.length ? clearAll : selectAll}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                border: '1px solid #cbd5e0',
                background: selected.length === releases.length ? '#1F3864' : '#fff',
                color: selected.length === releases.length ? '#fff' : '#4a5568',
              }}
            >
              {selected.length === releases.length ? 'Deselect all' : 'Select all'}
            </button>

            {releases.map((r) => {
              const isOn = selected.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                    border: `1px solid ${isOn ? '#1F3864' : '#cbd5e0'}`,
                    background: isOn ? '#1F3864' : '#fff',
                    color: isOn ? '#fff' : '#4a5568',
                    fontWeight: isOn ? 600 : 400,
                  }}
                >
                  {r.version}{r.name ? ` — ${r.name}` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected.length === 0 && releases && releases.length > 0 && (
        <div style={{
          background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 8,
          padding: '20px 24px', color: '#2c5282', fontSize: 14,
        }}>
          Select at least one release above to load the comparison.
        </div>
      )}

      {metricsLoading && selected.length > 0 && (
        <div style={{ color: '#718096', fontSize: 14 }}>Loading metrics…</div>
      )}

      {hasData && (
        <>
          {/* Summary table */}
          <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
            overflow: 'hidden', marginBottom: 24,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f7fafc' }}>
                  {['Release', 'Bugs', 'Avg Resolution', 'Duration', 'Planned hrs', 'Actual hrs', 'Variance', 'Story pts', ''].map((h) => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#4a5568',
                      fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const release = selectedReleaseObjects.find((r) => r.version === m.releaseVersion);
                  const overSLA = m.avgBugResolutionDays !== null && m.avgBugResolutionDays > SLA_DAYS;
                  const overEffort = m.effortVariancePercent !== null && m.effortVariancePercent > 10;
                  return (
                    <tr key={m.releaseVersion} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1F3864' }}>{m.releaseVersion}</td>
                      <td style={{ padding: '10px 14px' }}>{m.totalBugs}</td>
                      <td style={{ padding: '10px 14px', color: overSLA ? '#c53030' : undefined, fontWeight: overSLA ? 600 : undefined }}>
                        {m.avgBugResolutionDays !== null ? `${m.avgBugResolutionDays.toFixed(1)} d` : '—'}
                        {overSLA && <span style={{ fontSize: 10, marginLeft: 4 }}>⚠ SLA</span>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {m.releaseDurationDays !== null ? `${m.releaseDurationDays} d` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>{m.plannedHours} hrs</td>
                      <td style={{ padding: '10px 14px' }}>{m.actualHours} hrs</td>
                      <td style={{ padding: '10px 14px', color: overEffort ? '#c53030' : m.effortVariancePercent !== null && m.effortVariancePercent < 0 ? '#276749' : undefined, fontWeight: overEffort ? 600 : undefined }}>
                        {m.effortVariancePercent !== null ? `${m.effortVariancePercent > 0 ? '+' : ''}${m.effortVariancePercent}%` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>{m.storyPoints} pts</td>
                      <td style={{ padding: '10px 14px' }}>
                        {release && (
                          <button
                            onClick={() => setDetailRelease(release)}
                            style={{
                              padding: '3px 10px', border: '1px solid #1F3864', borderRadius: 4,
                              background: '#fff', color: '#1F3864', fontSize: 11, cursor: 'pointer', fontWeight: 600,
                            }}
                          >
                            View items
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Aggregate KPIs */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <MetricCard label="Total Bugs" value={totalBugs} />
            <MetricCard
              label="Avg Resolution"
              value={avgRes !== null ? parseFloat(avgRes.toFixed(1)) : null}
              unit="days"
              alert={avgRes !== null && avgRes > SLA_DAYS}
            />
            <MetricCard label="Total Planned" value={totalPlanned} unit="hrs" />
            <MetricCard
              label="Total Actual"
              value={totalActual}
              unit="hrs"
              alert={effortVariance !== null && effortVariance > 10}
              subtitle={effortVariance !== null ? `${effortVariance > 0 ? '+' : ''}${effortVariance}% vs planned` : undefined}
            />
            <MetricCard label="Story Points" value={metrics.reduce((s, m) => s + m.storyPoints, 0)} unit="pts" />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 20, marginBottom: 20 }}>
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

          {metrics.length > 1 && (
            <ChartSection title="Trend — Bugs vs Stories vs Story Points">
              <TrendCorrelationChart data={metrics} />
            </ChartSection>
          )}
        </>
      )}

      {detailRelease && (
        <ReleaseDetailPanel
          releaseId={detailRelease.id}
          releaseVersion={detailRelease.version}
          onClose={() => setDetailRelease(null)}
        />
      )}
    </div>
  );
}
