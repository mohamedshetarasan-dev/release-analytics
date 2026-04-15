import { useState } from 'react';
import { useWorkItems } from '../../hooks/useReleaseData';
import type { WorkItem, WorkItemType } from '../../types';

interface Props {
  releaseId: string;
  releaseVersion: string;
  onClose: () => void;
}

const TYPE_COLORS: Record<WorkItemType, string> = {
  bug:        '#fed7d7',
  task:       '#bee3f8',
  user_story: '#c6f6d5',
  feature:    '#e9d8fd',
};
const TYPE_TEXT: Record<WorkItemType, string> = {
  bug:        '#9b2c2c',
  task:       '#2c5282',
  user_story: '#276749',
  feature:    '#553c9a',
};
const TYPE_LABELS: Record<WorkItemType, string> = {
  bug:        'Bug',
  task:       'Task',
  user_story: 'User Story',
  feature:    'Feature',
};

const ALL_TYPES: WorkItemType[] = ['user_story', 'task', 'bug', 'feature'];

function fmt(ms: number | null) {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function ReleaseDetailPanel({ releaseId, releaseVersion, onClose }: Props) {
  const [activeType, setActiveType] = useState<WorkItemType | 'all'>('all');
  const { data: items, isLoading } = useWorkItems(releaseId);

  const filtered = activeType === 'all'
    ? (items ?? [])
    : (items ?? []).filter((i) => i.type === activeType);

  const counts = (items ?? []).reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '70vw', maxWidth: 900,
          background: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f7fafc',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Release
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1F3864' }}>{releaseVersion}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: '1px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', fontSize: 18, color: '#718096',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Type filter tabs */}
        <div style={{
          padding: '12px 28px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          <TabBtn
            label={`All (${items?.length ?? 0})`}
            active={activeType === 'all'}
            onClick={() => setActiveType('all')}
          />
          {ALL_TYPES.map((t) => (
            <TabBtn
              key={t}
              label={`${TYPE_LABELS[t]} (${counts[t] ?? 0})`}
              active={activeType === t}
              onClick={() => setActiveType(t)}
              color={TYPE_COLORS[t]}
              textColor={TYPE_TEXT[t]}
            />
          ))}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: 28, color: '#718096', fontSize: 14 }}>Loading work items…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 28, color: '#a0aec0', fontSize: 14 }}>No items.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: '#f7fafc' }}>
                  {['ID', 'Type', 'Title', 'State', 'Assigned To', 'Iteration', 'Activated', 'Closed'].map((h) => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                      color: '#4a5568', fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: '0.04em', borderBottom: '2px solid #e2e8f0',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: WorkItem) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '10px 14px', color: '#718096', whiteSpace: 'nowrap' }}>
                      {item.azureId}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11,
                        fontWeight: 600, background: TYPE_COLORS[item.type], color: TYPE_TEXT[item.type],
                      }}>
                        {TYPE_LABELS[item.type]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#2d3748', maxWidth: 280 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                           title={item.title}>
                        {item.title}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#4a5568', whiteSpace: 'nowrap' }}>
                      {item.state}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#4a5568', whiteSpace: 'nowrap' }}>
                      {item.assignedTo ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#718096', fontSize: 12, maxWidth: 180 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                           title={item.iterationPath ?? ''}>
                        {item.iterationPath ?? '—'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#718096', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {fmt(item.activatedDate)}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#718096', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {fmt(item.closedDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 28px', borderTop: '1px solid #e2e8f0',
          fontSize: 12, color: '#a0aec0', background: '#f7fafc',
        }}>
          {filtered.length} item{filtered.length !== 1 ? 's' : ''} shown
        </div>
      </div>
    </>
  );
}

function TabBtn({
  label, active, onClick, color, textColor,
}: {
  label: string; active: boolean; onClick: () => void;
  color?: string; textColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: active ? 600 : 400,
        border: `1px solid ${active ? '#1F3864' : '#cbd5e0'}`,
        background: active ? (color ?? '#1F3864') : '#fff',
        color: active ? (textColor ?? '#fff') : '#4a5568',
      }}
    >
      {label}
    </button>
  );
}
