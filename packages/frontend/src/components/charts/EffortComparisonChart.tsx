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

export default function EffortComparisonChart({ data }: Props) {
  const chartData = data.map((d) => ({
    version: d.releaseVersion,
    'Planned (hrs)': d.plannedHours,
    'Actual (hrs)': d.actualHours,
    'Story Points': d.storyPoints,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="version" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Planned (hrs)" fill="#63b3ed" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Actual (hrs)" fill="#f6ad55" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Story Points" fill="#9f7aea" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
