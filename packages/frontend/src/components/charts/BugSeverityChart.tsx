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

// Standard Azure DevOps severity labels → colours
const SEVERITY_COLORS: Record<string, string> = {
  '1 - Critical': '#e53e3e',
  '2 - High':     '#f6ad55',
  '3 - Medium':   '#ecc94b',
  '4 - Low':      '#68d391',
  'Unspecified':  '#a0aec0',
};

const SEVERITY_ORDER = ['1 - Critical', '2 - High', '3 - Medium', '4 - Low', 'Unspecified'];

export default function BugSeverityChart({ data }: Props) {
  // Collect all severity labels present in the data
  const allSeverities = Array.from(
    new Set([
      ...SEVERITY_ORDER,
      ...data.flatMap((d) => Object.keys(d.bugsBySeverity)),
    ]),
  ).filter((s) => data.some((d) => (d.bugsBySeverity[s] ?? 0) > 0));

  const chartData = data.map((d) => ({
    version: d.releaseVersion,
    ...Object.fromEntries(allSeverities.map((s) => [s, d.bugsBySeverity[s] ?? 0])),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="version" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {allSeverities.map((sev) => (
          <Bar
            key={sev}
            dataKey={sev}
            stackId="a"
            fill={SEVERITY_COLORS[sev] ?? '#9f7aea'}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
