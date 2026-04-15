import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReleases } from '../hooks/useReleaseData';
import DataTable from '../components/shared/DataTable';
import ReleaseDetailPanel from '../components/shared/ReleaseDetailPanel';
import { releasesApi } from '../services/releases';
import type { Release } from '../types';

export default function ReleasesPage() {
  const { data: releases, isLoading, error } = useReleases();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [detailRelease, setDetailRelease] = useState<Release | null>(null);

  const handleDelete = async (id: string, version: string) => {
    if (!window.confirm(`Delete release ${version} and all its work items?`)) return;
    setDeleting(id);
    try {
      await releasesApi.delete(id);
      await queryClient.invalidateQueries({ queryKey: ['releases'] });
    } catch {
      alert('Delete failed. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const columns = [
    { key: 'version', header: 'Version' },
    { key: 'name', header: 'Name', render: (r: Release) => r.name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (r: Release) => (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            background: r.status === 'completed' ? '#c6f6d5' : '#bee3f8',
            color: r.status === 'completed' ? '#276749' : '#2c5282',
          }}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (r: Release) =>
        new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }),
    },
    {
      key: 'actions',
      header: '',
      render: (r: Release) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setDetailRelease(r)}
            style={{
              padding: '4px 12px', background: '#fff',
              border: '1px solid #1F3864', borderRadius: 4,
              color: '#1F3864', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            View items
          </button>
          <button
            onClick={() => handleDelete(r.id, r.version)}
            disabled={deleting === r.id}
            style={{
              padding: '4px 12px', background: 'none',
              border: '1px solid #fc8181', borderRadius: 4,
              color: '#c53030', cursor: 'pointer', fontSize: 12,
            }}
          >
            {deleting === r.id ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', color: '#1F3864', fontSize: 22 }}>Releases</h1>
      <p style={{ color: '#718096', margin: '0 0 20px', fontSize: 14 }}>
        All imported releases. Delete a release to remove it and all associated work items.
      </p>

      {isLoading && <div style={{ color: '#718096', fontSize: 14 }}>Loading…</div>}
      {error && <div style={{ color: '#c53030', fontSize: 14 }}>Failed to load releases.</div>}

      {!isLoading && !error && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          <DataTable
            columns={columns}
            data={releases ?? []}
            rowKey={(r) => r.id}
            emptyMessage="No releases yet. Import an Azure DevOps export to get started."
          />
        </div>
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
