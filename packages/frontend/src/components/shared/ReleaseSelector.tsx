import { useReleases } from '../../hooks/useReleaseData';
import { useAppStore } from '../../store';

export default function ReleaseSelector() {
  const { data: releases, isLoading, error } = useReleases();
  const { selectedReleaseIds, toggleReleaseId, setSelectedReleaseIds } = useAppStore();

  if (isLoading) return <div style={{ color: '#718096', fontSize: 14 }}>Loading releases…</div>;
  if (error) return <div style={{ color: '#c53030', fontSize: 14 }}>Failed to load releases.</div>;
  if (!releases || releases.length === 0)
    return (
      <div style={{ color: '#718096', fontSize: 14 }}>
        No releases found.{' '}
        <a href="/import" style={{ color: '#3182ce' }}>
          Import data first.
        </a>
      </div>
    );

  const allSelected = releases.every((r) => selectedReleaseIds.includes(r.id));

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <button
        onClick={() =>
          allSelected
            ? setSelectedReleaseIds([])
            : setSelectedReleaseIds(releases.map((r) => r.id))
        }
        style={{
          padding: '6px 14px',
          borderRadius: 20,
          border: '1px solid #cbd5e0',
          background: allSelected ? '#1F3864' : '#fff',
          color: allSelected ? '#fff' : '#4a5568',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {allSelected ? 'Deselect all' : 'Select all'}
      </button>

      {releases.map((release) => {
        const isSelected = selectedReleaseIds.includes(release.id);
        return (
          <button
            key={release.id}
            onClick={() => toggleReleaseId(release.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1px solid ${isSelected ? '#1F3864' : '#cbd5e0'}`,
              background: isSelected ? '#1F3864' : '#fff',
              color: isSelected ? '#fff' : '#4a5568',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: isSelected ? 600 : 400,
            }}
          >
            {release.version}
            {release.name ? ` — ${release.name}` : ''}
          </button>
        );
      })}
    </div>
  );
}
