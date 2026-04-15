interface Props {
  label: string;
  value: string | number | null;
  unit?: string;
  alert?: boolean;
  subtitle?: string;
}

export default function MetricCard({ label, value, unit, alert, subtitle }: Props) {
  const displayValue = value === null || value === undefined ? 'N/A' : value;
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${alert ? '#fc8181' : '#e2e8f0'}`,
        borderRadius: 8,
        padding: '20px 24px',
        minWidth: 180,
        boxShadow: alert ? '0 0 0 2px #feb2b2' : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ fontSize: 12, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: alert ? '#c53030' : '#1F3864', lineHeight: 1 }}>
        {displayValue}
        {unit && displayValue !== 'N/A' && (
          <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4, color: '#718096' }}>{unit}</span>
        )}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 6 }}>{subtitle}</div>
      )}
    </div>
  );
}
