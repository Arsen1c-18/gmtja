import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactFmt, numFmt } from '../../utils/formatters';

export interface TimeBucket {
  period: string;
  mae: number | null;
}

export interface ErrorByTimeChartProps {
  data: TimeBucket[];
  height?: number;
}

export function ErrorByTimeChart({ data, height = 260 }: ErrorByTimeChartProps) {
  return (
    <div style={{ height }} className="w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="2 2" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => compactFmt.format(v)}
            width={48}
          />
          <Tooltip
            formatter={(v) => [v == null ? '—' : `${numFmt.format(Number(v))} MW`, 'MAE']}
            contentStyle={{
              borderRadius: '4px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="mae" fill="#ff5500" maxBarSize={32} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
