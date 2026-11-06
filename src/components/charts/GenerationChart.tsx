import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MergedIntervalRow } from '../../utils/chartHelpers';
import { compactFmt } from '../../utils/formatters';
import { ChartTooltip } from './ChartTooltip';

export interface GenerationChartProps {
  chartData: MergedIntervalRow[];
  compactView?: boolean;
  height?: number;
}

export function GenerationChart({ chartData, compactView = false, height }: GenerationChartProps) {
  const chartHeight = height ?? (compactView ? 280 : 360);

  return (
    <div style={{ height: chartHeight }} className="w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="2 2" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#71717a' }}
            interval={compactView ? 7 : 3}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => compactFmt.format(v)}
            width={48}
          />
          <Tooltip content={<ChartTooltip unit="MW" />} />
          <Area
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="#ff5500"
            strokeWidth={2.2}
            fill="#ff5500"
            fillOpacity={0.08}
            connectNulls={false}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#ff5500' }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#18181b"
            strokeWidth={1.8}
            dot={false}
            connectNulls={false}
            activeDot={{ r: 4, fill: '#18181b' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
