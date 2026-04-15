import { useNavigate } from 'react-router-dom';
import FileUploader from '../components/upload/FileUploader';
import UploadProgress from '../components/upload/UploadProgress';
import { useUpload } from '../hooks/useUpload';

export default function ImportPage() {
  const navigate = useNavigate();
  const { upload, uploading, progress, result, error, reset } = useUpload();

  const handleFile = (file: File) => {
    upload(file);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ margin: '0 0 4px', color: '#1F3864', fontSize: 22 }}>Import Data</h1>
      <p style={{ color: '#718096', margin: '0 0 24px', fontSize: 14 }}>
        Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file exported from Azure DevOps.
        Work items will be parsed and grouped by release version automatically.
      </p>

      <FileUploader onFile={handleFile} disabled={uploading} />
      <UploadProgress
        uploading={uploading}
        progress={progress}
        result={result}
        error={error}
        onReset={reset}
      />

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
