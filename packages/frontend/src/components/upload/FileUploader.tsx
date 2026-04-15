import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export default function FileUploader({ onFile, disabled }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#3182ce' : '#cbd5e0'}`,
          borderRadius: 8,
          padding: '48px 24px',
          textAlign: 'center',
          background: isDragActive ? '#ebf8ff' : '#f7fafc',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
        {isDragActive ? (
          <p style={{ color: '#3182ce', fontWeight: 600 }}>Drop the file here…</p>
        ) : (
          <>
            <p style={{ color: '#4a5568', fontWeight: 600, margin: '0 0 4px' }}>
              Drag & drop a file here, or click to browse
            </p>
            <p style={{ color: '#a0aec0', fontSize: 13, margin: 0 }}>
              Accepted: .csv, .xlsx — max 10 MB
            </p>
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div style={{ marginTop: 8, color: '#c53030', fontSize: 13 }}>
          {fileRejections[0].errors.map((e) => e.message).join(', ')}
        </div>
      )}
    </div>
  );
}
