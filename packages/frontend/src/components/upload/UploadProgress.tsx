import type { ImportResult } from '../../types';

interface Props {
  uploading: boolean;
  progress: number;
  result: ImportResult | null;
  error: string | null;
  onReset: () => void;
}

export default function UploadProgress({ uploading, progress, result, error, onReset }: Props) {
  if (!uploading && !result && !error) return null;

  return (
    <div style={{ marginTop: 24 }}>
      {uploading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#4a5568' }}>
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: '#3182ce',
                borderRadius: 4,
                transition: 'width 0.2s',
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#fff5f5',
            border: '1px solid #fc8181',
            borderRadius: 8,
            padding: '16px 20px',
            color: '#c53030',
          }}
        >
          <strong>Upload failed:</strong> {error}
          <button
            onClick={onReset}
            style={{ marginLeft: 16, color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            Try again
          </button>
        </div>
      )}

      {result && (
        <div
          style={{
            background: '#f0fff4',
            border: '1px solid #68d391',
            borderRadius: 8,
            padding: '16px 20px',
          }}
        >
          <div style={{ fontWeight: 600, color: '#276749', marginBottom: 8 }}>Import complete</div>
          <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
            <span><strong>{result.rowsImported}</strong> imported</span>
            <span style={{ color: '#718096' }}><strong>{result.rowsSkipped}</strong> skipped</span>
            {result.rowsFailed > 0 && (
              <span style={{ color: '#c53030' }}><strong>{result.rowsFailed}</strong> failed</span>
            )}
          </div>

          {result.errors && result.errors.length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: '#718096' }}>
                {result.errors.length} row error(s)
              </summary>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 12, color: '#c53030' }}>
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i}>Row {e.row}: {e.message}</li>
                ))}
                {result.errors.length > 20 && <li>…and {result.errors.length - 20} more</li>}
              </ul>
            </details>
          )}

          <button
            onClick={onReset}
            style={{
              marginTop: 12,
              padding: '6px 14px',
              background: '#1F3864',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}
