import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { compactFmt, numFmt, stampFmt } from '../../utils/formatters';

export interface VersionPoint {
  publish_time: string;
  publishedLabel: string;
  mae: number | null;
}

export interface VersionTimelineChartProps {
  data: VersionPoint[];
  height?: number;
}

export function VersionTimelineChart({ data, height = 280 }: VersionTimelineChartProps) {
  return (
    <div style={{ height }} className="w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: -10, right: 10, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="2 2" vertical={false} />
          <XAxis
            dataKey="publishedLabel"
            tick={{ fontSize: 9, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => compactFmt.format(v)}
            width={48}
          />
          <Tooltip
            labelFormatter={(_, payload) => {
              const raw = payload?.[0]?.payload?.publish_time;
              return raw ? `Published ${stampFmt.format(new Date(raw))}` : '';
            }}
            formatter={(v) => [v == null ? '—' : `${numFmt.format(Number(v))} MW`, 'Version MAE']}
            contentStyle={{
              borderRadius: '4px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              fontSize: '12px',
            }}
          />
          <Line
            type="monotone"
            dataKey="mae"
            name="Version MAE"
            stroke="#ff5500"
            strokeWidth={2}
            dot={{ r: 3, fill: '#ff5500' }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
