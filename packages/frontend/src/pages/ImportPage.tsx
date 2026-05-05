import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../components/upload/FileUploader';
import UploadProgress from '../components/upload/UploadProgress';
import { useUpload } from '../hooks/useUpload';
import { useQueryClient } from '@tanstack/react-query';

export default function ImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { upload, uploading, progress, result, error, reset } = useUpload();
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) return;
    setClearing(true);
    setClearMsg(null);
    try {
      const res = await fetch('/api/v1/admin/clear', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear');
      await queryClient.invalidateQueries();
      reset();
      setClearMsg({ ok: true, text: 'All data cleared. Ready for a new import.' });
    } catch {
      setClearMsg({ ok: false, text: 'Failed to clear data. Please try again.' });
    } finally {
      setClearing(false);
    }
  };

  const handleFile = (file: File) => {
    upload(file);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ margin: '0 0 4px', color: '#1F3864', fontSize: 22 }}>Import Data</h1>
      <p style={{ color: '#718096', margin: '0 0 16px', fontSize: 14 }}>
        Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file exported from Azure DevOps.
        Work items will be parsed and grouped by release version automatically.
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
        padding: '10px 14px',
        background: '#ebf8ff',
        border: '1px solid #bee3f8',
        borderRadius: 8,
        fontSize: 13,
        color: '#2b6cb0',
      }}>
        <span>📄</span>
        <span>Not sure about the format?</span>
        <a
          href="/import-template.csv"
          download="import-template.csv"
          style={{ fontWeight: 600, color: '#2b6cb0', textDecoration: 'underline' }}
        >
          Download CSV template
        </a>
      </div>

      <FileUploader onFile={handleFile} disabled={uploading} />
      <UploadProgress
        uploading={uploading}
        progress={progress}
        result={result}
        error={error}
        onReset={reset}
      />

      {/* Clear database */}
      <div style={{
        marginTop: 32,
        padding: '16px 20px',
        border: '1px solid #fed7d7',
        borderRadius: 8,
        background: '#fff5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontWeight: 600, color: '#c53030', fontSize: 14 }}>Clear All Data</div>
          <div style={{ color: '#718096', fontSize: 13, marginTop: 2 }}>
            Remove all releases and work items to start fresh.
          </div>
        </div>
        <button
          onClick={handleClear}
          disabled={clearing}
          style={{
            padding: '8px 20px',
            background: clearing ? '#feb2b2' : '#e53e3e',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: clearing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 14,
            whiteSpace: 'nowrap',
          }}
        >
          {clearing ? 'Clearing…' : '🗑 Clear Database'}
        </button>
      </div>

      {clearMsg && (
        <div style={{
          marginTop: 10,
          padding: '10px 14px',
          borderRadius: 6,
          fontSize: 13,
          background: clearMsg.ok ? '#f0fff4' : '#fff5f5',
          color: clearMsg.ok ? '#276749' : '#c53030',
          border: `1px solid ${clearMsg.ok ? '#9ae6b4' : '#feb2b2'}`,
        }}>
          {clearMsg.ok ? '✅' : '❌'} {clearMsg.text}
        </div>
      )}

      {result && !uploading && (
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 20px',
              background: '#1F3864',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/releases')}
            style={{
              padding: '8px 20px',
              background: '#fff',
              color: '#1F3864',
              border: '1px solid #1F3864',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            View Releases
          </button>
        </div>
      )}
    </div>
  );
}
