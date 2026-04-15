import { useState } from 'react';
import { useReleases } from '../../hooks/useReleaseData';
import { useAppStore } from '../../store';
import type { Release, ReleaseMetrics } from '../../types';

interface Props {
  metricsMap?: Record<string, ReleaseMetrics>;
}

function isMajor(version: string): boolean {
  const parts = version.split('.');
  const patch = parts[2] ? parseInt(parts[2], 10) : 0;
  return patch === 0;
}

function semverCompare(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function ReleaseGroup({
  label,
  releases,
  selectedIds,
  metricsMap,
  onToggle,
  onSelectAll,
  onClearAll,
  defaultExpanded = true,
}: {
  label: string;
  releases: Release[];
  selectedIds: string[];
  metricsMap: Record<string, ReleaseMetrics>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClearAll: (ids: string[]) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  if (releases.length === 0) return null;

  const groupIds      = releases.map((r) => r.id);
  const allSelected   = groupIds.every((id) => selectedIds.includes(id));
  const selectedCount = groupIds.filter((id) => selectedIds.includes(id)).length;

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Group header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: expanded ? 10 : 0 }}>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <span style={{ fontSize: 12, color: '#718096', lineHeight: 1 }}>
            {expanded ? '▾' : '▸'}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: '#4a5568',
          }}>
            {label}
          </span>
        </button>
        <span style={{ fontSize: 11, color: '#a0aec0' }}>
          ({releases.length}{selectedCount > 0 ? `, ${selectedCount} selected` : ''})
        </span>
        {expanded && (
          <button
            onClick={() => allSelected ? onClearAll(groupIds) : onSelectAll(groupIds)}
            style={{
              fontSize: 11, color: '#3182ce', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline',
            }}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {/* Chips */}
      {expanded && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {releases.map((release) => {
            const isSelected = selectedIds.includes(release.id);
            const m = metricsMap[release.version];
            return (
              <button
                key={release.id}
                onClick={() => onToggle(release.id)}
                style={{
                  padding: '6px 14px', borderRadius: 20,
                  border: `1px solid ${isSelected ? '#1F3864' : '#cbd5e0'}`,
                  background: isSelected ? '#1F3864' : '#fff',
                  color: isSelected ? '#fff' : '#4a5568',
                  fontSize: 13, cursor: 'pointer',
                  fontWeight: isSelected ? 600 : 400,
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1,
                  textAlign: 'left',
                }}
              >
                <span>{release.version}{release.name ? ` — ${release.name}` : ''}</span>
                {m && (
                  <span style={{
                    fontSize: 10,
                    color: isSelected ? 'rgba(255,255,255,0.7)' : '#a0aec0',
                    fontWeight: 400,
                  }}>
                    {m.userStoryCount} stories · {m.storyPoints} pts · {m.totalBugs} bugs
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReleaseSelector({ metricsMap = {} }: Props) {
  const { data: releases, isLoading, error } = useReleases();
  const { selectedReleaseIds, toggleReleaseId, setSelectedReleaseIds } = useAppStore();

  if (isLoading) return <div style={{ color: '#718096', fontSize: 14 }}>Loading releases…</div>;
  if (error)     return <div style={{ color: '#c53030', fontSize: 14 }}>Failed to load releases.</div>;
  if (!releases || releases.length === 0)
    return (
      <div style={{ color: '#718096', fontSize: 14 }}>
        No releases found.{' '}
        <a href="/import" style={{ color: '#3182ce' }}>Import data first.</a>
      </div>
    );

  const majorReleases = releases.filter((r) =>  isMajor(r.version)).sort((a, b) => semverCompare(a.version, b.version));
  const lightReleases = releases.filter((r) => !isMajor(r.version)).sort((a, b) => semverCompare(a.version, b.version));

  const handleSelectAll = (ids: string[]) =>
    setSelectedReleaseIds([...new Set([...selectedReleaseIds, ...ids])]);

  const handleClearAll = (ids: string[]) =>
    setSelectedReleaseIds(selectedReleaseIds.filter((id) => !ids.includes(id)));

  const allIds      = releases.map((r) => r.id);
  const allSelected = allIds.every((id) => selectedReleaseIds.includes(id));

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 20px',
    }}>
      {/* Global select/deselect */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => allSelected ? setSelectedReleaseIds([]) : setSelectedReleaseIds(allIds)}
          style={{
            padding: '5px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            border: '1px solid #cbd5e0',
            background: allSelected ? '#1F3864' : '#fff',
            color: allSelected ? '#fff' : '#4a5568',
            fontWeight: 600,
          }}
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
        {selectedReleaseIds.length > 0 && (
          <span style={{ fontSize: 12, color: '#718096' }}>
            {selectedReleaseIds.length} of {releases.length} selected
          </span>
        )}
      </div>

      <ReleaseGroup
        label="Major releases"
        releases={majorReleases}
        selectedIds={selectedReleaseIds}
        metricsMap={metricsMap}
        onToggle={toggleReleaseId}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />

      {majorReleases.length > 0 && lightReleases.length > 0 && (
        <div style={{ borderTop: '1px solid #edf2f7', marginBottom: 16 }} />
      )}

      <ReleaseGroup
        label="Light releases"
        releases={lightReleases}
        selectedIds={selectedReleaseIds}
        metricsMap={metricsMap}
        onToggle={toggleReleaseId}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
