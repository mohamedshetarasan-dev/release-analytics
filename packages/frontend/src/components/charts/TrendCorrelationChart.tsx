import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ReleaseMetrics } from '../../types';

interface Props {
  data: ReleaseMetrics[];
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
      padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontWeight: 700, color: '#1F3864', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value ?? 'N/A'}</strong>
        </div>
      ))}
    </div>
  );
};

export default function TrendCorrelationChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => semverCompare(a.releaseVersion, b.releaseVersion));

  const chartData = sorted.map((m) => ({
    version: m.releaseVersion,
    Bugs: m.totalBugs,
    Stories: m.userStoryCount,
    'Story Points': m.storyPoints,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 40, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="version"
          tick={{ fontSize: 11 }}
          angle={-35}
          textAnchor="end"
          height={48}
          interval={0}
        />
        {/* Left axis — Bugs & Stories (count) */}
        <YAxis
          yAxisId="count"
          orientation="left"
          allowDecimals={false}
          tick={{ fontSize: 11 }}
          label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#718096' } }}
        />
        {/* Right axis — Story Points */}
        <YAxis
          yAxisId="pts"
          orientation="right"
          allowDecimals={false}
          tick={{ fontSize: 11 }}
          label={{ value: 'Story pts', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 11, fill: '#718096' } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />

        <Line
          yAxisId="count"
          type="monotone"
          dataKey="Bugs"
          stroke="#fc8181"
          strokeWidth={2}
          dot={{ r: 3, fill: '#fc8181' }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="count"
          type="monotone"
          dataKey="Stories"
          stroke="#63b3ed"
          strokeWidth={2}
          dot={{ r: 3, fill: '#63b3ed' }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="pts"
          type="monotone"
          dataKey="Story Points"
          stroke="#9f7aea"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={{ r: 3, fill: '#9f7aea' }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
