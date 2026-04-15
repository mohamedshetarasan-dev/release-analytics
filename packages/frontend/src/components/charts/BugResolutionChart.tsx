import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ReleaseMetrics } from '../../types';

const SLA_DAYS = 5;

interface Props {
  data: ReleaseMetrics[];
  slaDays?: number;
}

export default function BugResolutionChart({ data, slaDays = SLA_DAYS }: Props) {
  const chartData = data.map((d) => ({
    version: d.releaseVersion,
    avgDays: d.avgBugResolutionDays !== null ? parseFloat(d.avgBugResolutionDays.toFixed(1)) : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="version" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} unit=" d" allowDecimals />
        <Tooltip formatter={(v: unknown) => (v === null ? 'N/A' : `${v} days`)} />
        <ReferenceLine y={slaDays} stroke="#fc8181" strokeDasharray="4 4" label={{ value: `SLA ${slaDays}d`, fill: '#c53030', fontSize: 11 }} />
        <Bar dataKey="avgDays" name="Avg resolution (days)" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, idx) => (
            <Cell
              key={idx}
              fill={
                entry.avgDays === null
                  ? '#e2e8f0'
                  : entry.avgDays > slaDays
                  ? '#fc8181'
                  : '#68d391'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
