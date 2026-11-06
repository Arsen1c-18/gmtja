import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface DistributionBin {
  bin: string;
  intervals: number;
}

export interface ErrorDistributionChartProps {
  data: DistributionBin[];
  height?: number;
}

export function ErrorDistributionChart({ data, height = 260 }: ErrorDistributionChartProps) {
  return (
    <div style={{ height }} className="w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="2 2" vertical={false} />
          <XAxis
            dataKey="bin"
            tick={{ fontSize: 9, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '4px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              fontSize: '12px',
            }}
          />
          <Bar
            dataKey="intervals"
            name="Intervals"
            fill="#a1a1aa"
            maxBarSize={32}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
