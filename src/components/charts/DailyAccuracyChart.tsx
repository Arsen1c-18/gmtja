import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyMetric } from '../../types';
import { compactFmt, numFmt } from '../../utils/formatters';

export interface DailyAccuracyChartProps {
  metrics: DailyMetric[];
  height?: number;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}

export function DailyAccuracyChart({
  metrics,
  height = 250,
  selectedDate,
  onSelectDate,
}: DailyAccuracyChartProps) {
  return (
    <div style={{ height }} className="w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={metrics}
          margin={{ left: -10, right: 10, top: 10, bottom: 0 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={(state: any) => {
            const date = state?.activeLabel ?? state?.activePayload?.[0]?.payload?.date;
            if (date && onSelectDate) {
              onSelectDate(String(date));
            }
          }}
          style={{ cursor: onSelectDate ? 'pointer' : 'default' }}
        >
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="2 2" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => String(v).slice(8)}
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => compactFmt.format(v)}
            width={48}
          />
          <Tooltip
            labelFormatter={(v) => `Delivery day ${String(v).slice(8)} Jan 2026 (click to open)`}
            formatter={(v) => [
              v == null ? 'No paired records' : `${numFmt.format(Number(v))} MW`,
              'MAE',
            ]}
            contentStyle={{
              borderRadius: '4px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              fontSize: '12px',
            }}
          />
          <Line
            dataKey="mae_mw"
            name="MAE"
            stroke="#ff5500"
            strokeWidth={2}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (cx == null || cy == null) return <span key={props.key} />;
              const isSelected = selectedDate && payload?.date === selectedDate;
              if (isSelected) {
                return (
                  <g key={`dot-${payload?.date}`}>
                    <circle cx={cx} cy={cy} r={7} fill="#ff5500" fillOpacity={0.25} />
                    <circle cx={cx} cy={cy} r={3.5} fill="#ff5500" stroke="#ffffff" strokeWidth={1.5} />
                  </g>
                );
              }
              return (
                <circle
                  key={`dot-${payload?.date}`}
                  cx={cx}
                  cy={cy}
                  r={2.5}
                  fill="#ff5500"
                />
              );
            }}
            activeDot={{ r: 5, fill: '#ff5500' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
