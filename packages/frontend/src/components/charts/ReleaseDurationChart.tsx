import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { ReleaseMetrics } from '../../types';

interface Props {
  data: ReleaseMetrics[];
}

export default function ReleaseDurationChart({ data }: Props) {
  const chartData = data.map((d) => ({
    version: d.releaseVersion,
    days: d.releaseDurationDays,
  }));

  const avg =
    chartData.filter((d) => d.days !== null).length > 0
      ? chartData.reduce((s, d) => s + (d.days ?? 0), 0) /
        chartData.filter((d) => d.days !== null).length
      : null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} unit=" d" />
        <YAxis type="category" dataKey="version" tick={{ fontSize: 12 }} width={80} />
        <Tooltip formatter={(v: unknown) => (v === null ? 'In Progress' : `${v} days`)} />
        {avg !== null && (
          <ReferenceLine
            x={parseFloat(avg.toFixed(1))}
            stroke="#1F3864"
            strokeDasharray="4 4"
            label={{ value: `Avg ${avg.toFixed(1)}d`, fill: '#1F3864', fontSize: 11 }}
          />
        )}
        <Bar dataKey="days" name="Duration (days)" fill="#63b3ed" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
