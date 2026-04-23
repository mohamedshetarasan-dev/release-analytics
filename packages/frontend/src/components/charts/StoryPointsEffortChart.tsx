import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';
import type { ReleaseMetrics } from '../../types';

interface Props {
  data: ReleaseMetrics[];
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: { version: string };
}

function CustomDot({ cx = 0, cy = 0, payload }: CustomDotProps) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#63b3ed" stroke="#fff" strokeWidth={1.5} opacity={0.85} />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10} fill="#718096">
        {payload?.version}
      </text>
    </g>
  );
}

interface TooltipPayload {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const sp = payload.find((p) => p.name === 'storyPoints');
  const hrs = payload.find((p) => p.name === 'actualHours');
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div><strong>Story Points:</strong> {sp?.value}</div>
      <div><strong>Actual Hours:</strong> {hrs?.value} hrs</div>
    </div>
  );
}

export default function StoryPointsEffortChart({ data }: Props) {
  const chartData = data.map((d) => ({
    version: d.releaseVersion,
    storyPoints: d.storyPoints,
    actualHours: d.actualHours,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 16, right: 24, left: 8, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="storyPoints" type="number" tick={{ fontSize: 12 }} name="storyPoints">
          <Label value="Story Points" offset={-12} position="insideBottom" fontSize={12} fill="#718096" />
        </XAxis>
        <YAxis dataKey="actualHours" type="number" tick={{ fontSize: 12 }} name="actualHours">
          <Label value="Actual Hours" angle={-90} position="insideLeft" offset={16} fontSize={12} fill="#718096" />
        </YAxis>
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={chartData} shape={<CustomDot />} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
