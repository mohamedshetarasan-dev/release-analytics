import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ReleaseMetrics } from '../../types';

interface Props {
  data: ReleaseMetrics[];
}

export default function EffortPerPointChart({ data }: Props) {
  const chartData = data
    .filter((d) => d.storyPoints > 0)
    .map((d) => ({
      version: d.releaseVersion,
      'Hrs / Point': parseFloat((d.actualHours / d.storyPoints).toFixed(2)),
    }));

  const avg =
    chartData.length > 0
      ? parseFloat(
          (chartData.reduce((s, d) => s + d['Hrs / Point'], 0) / chartData.length).toFixed(2),
        )
      : null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="version" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} unit=" hrs" />
        <Tooltip formatter={(v: number) => [`${v} hrs`, 'Hrs / Point']} />
        {avg !== null && (
          <ReferenceLine
            y={avg}
            stroke="#e53e3e"
            strokeDasharray="4 3"
            label={{ value: `Avg ${avg}`, position: 'insideTopRight', fontSize: 11, fill: '#e53e3e' }}
          />
        )}
        <Line
          dataKey="Hrs / Point"
          stroke="none"
          dot={{ r: 6, fill: '#63b3ed', stroke: '#fff', strokeWidth: 1.5 }}
          activeDot={{ r: 8 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
