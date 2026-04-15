import {
  BarChart,
  Bar,
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

const STATE_COLORS: Record<string, string> = {
  Active: '#f6ad55',
  New: '#76e4f7',
  Resolved: '#68d391',
  Closed: '#a0aec0',
};

const KNOWN_STATES = ['Active', 'New', 'Resolved', 'Closed'];

export default function BugCountChart({ data }: Props) {
  const allStates = Array.from(
    new Set([...KNOWN_STATES, ...data.flatMap((d) => Object.keys(d.bugsByState))]),
  );

  const chartData = data.map((d) => ({
    version: d.releaseVersion,
    ...Object.fromEntries(allStates.map((s) => [s, d.bugsByState[s] ?? 0])),
    Total: d.totalBugs,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="version" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {allStates.map((state) => (
          <Bar key={state} dataKey={state} fill={STATE_COLORS[state] ?? '#9f7aea'} stackId="a" />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
