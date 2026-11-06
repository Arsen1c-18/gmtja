import { Activity, AlertTriangle, Download, Gauge, Scale } from 'lucide-react';
import { WindTurbineSvg } from '../../components/ui/WindTurbineSvg';
import { Button } from '../../components/ui/Button';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { KpiCard } from '../../components/ui/KpiCard';
import { Input } from '../../components/ui/FormField';
import { ChartTooltip } from '../../components/charts/ChartTooltip';
import type { DayData } from '../../types';
import { exportProcurementCsv, type MergedIntervalRow } from '../../utils/chartHelpers';
import { compactFmt, formatCompact, formatNice, numFmt } from '../../utils/formatters';

export interface ProcurementViewProps {
  data: DayData;
  chartData: MergedIntervalRow[];
  demand: number;
  setDemand: (demand: number) => void;
  totalShortfall: number;
}

const DEMAND_PRESETS = [
  { label: '25 GW', value: 25000, desc: 'Low overnight demand' },
  { label: '30 GW', value: 30000, desc: 'Typical baseline' },
  { label: '35 GW', value: 35000, desc: 'Daytime working demand' },
  { label: '42 GW', value: 42000, desc: 'Winter peak demand' },
];

export function ProcurementView({
  data,
  chartData,
  demand,
  setDemand,
  totalShortfall,
}: ProcurementViewProps) {
  const peak = chartData.reduce<{ label: string; amount: number } | null>((best, r) => {
    if (r.forecast == null) return best;
    const amount = Math.max(0, demand - r.forecast);
    return !best || amount > best.amount ? { label: r.label, amount } : best;
  }, null);

  const rows = chartData.map((r) => ({
    ...r,
    demand_mw: demand,
    requirement: r.forecast == null ? null : demand - r.forecast,
  }));

  const expectedWindMWh = rows.reduce(
    (sum, r) => sum + (r.forecast ?? 0) * 0.5,
    0
  );

  return (
    <div className="space-y-6">
      {/* Scenario Input Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-md border border-ink-200/90 bg-white p-5 shadow-xs">
        <div className="max-w-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-accent-700">
            Illustrative demand scenario
          </div>
          <h2 className="mt-0.5 text-base font-bold text-ink-950 sm:text-lg">
            Set fixed system demand assumption
          </h2>
          <p className="mt-1 text-xs text-ink-600 leading-relaxed">
            Configure an illustrative demand baseline in MW to compute net residual procurement requirements against forecast wind.
          </p>

          {/* Quick Scenario Preset Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider mr-1">
              Presets:
            </span>
            {DEMAND_PRESETS.map((preset) => {
              const isActive = demand === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDemand(preset.value)}
                  className={`rounded-sm px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-ink-950 text-white shadow-2xs'
                      : 'border border-ink-200/80 bg-ink-50 text-ink-700 hover:bg-ink-100'
                  }`}
                  title={preset.desc}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-72 shrink-0">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
              Demand assumption (MW)
            </span>
            <Input
              type="number"
              min={100}
              max={100000}
              step={500}
              value={demand}
              onChange={(e) =>
                setDemand(Math.min(100000, Math.max(100, Number(e.target.value))))
              }
              className="font-mono font-semibold text-base"
            />
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Expected wind energy"
          value={data.eligible_publish_time ? formatCompact(expectedWindMWh, ' MWh') : 'Unavailable'}
          hint="Integrated over 30-min settlement periods"
          icon={WindTurbineSvg}
        />
        <KpiCard
          label="Scenario residual requirement"
          value={data.eligible_publish_time ? formatCompact(totalShortfall, ' MWh') : 'Unavailable'}
          hint="Illustrative demand minus forecast wind"
          icon={Scale}
          tone="warn"
        />
        <KpiCard
          label="Peak interval shortfall"
          value={peak ? `${formatNice(peak.amount)} MW` : '—'}
          hint={peak ? `Maximum deficit at ${peak.label} UK` : 'No forecast records'}
          icon={Activity}
        />
        <KpiCard
          label="Paired actual intervals"
          value={numFmt.format(data.metrics.count)}
          hint="Baseline intervals observed for validation"
          icon={Gauge}
        />
      </div>

      {/* Residual Procurement Chart */}
      <Card>
        <CardHeader
          title="Demand and forecast wind generation"
          subtitle="Residual requirement = illustrative demand minus forecast wind (excluding other generation or imports)"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportProcurementCsv(rows, demand, data.date)}
              icon={<Download size={13} />}
            >
              Export scenario CSV
            </Button>
          }
        />
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-600 pb-2">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-accent-600" />
              <span>Forecast wind</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="w-3 border-t-2 border-dashed border-ink-500" />
              <span>Illustrative demand</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-ink-950" />
              <span>Additional procurement</span>
            </span>
          </div>

          <div style={{ height: 340 }} className="w-full min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={rows}
                margin={{ left: -10, right: 12, top: 12, bottom: 0 }}
              >
                <CartesianGrid stroke="#e4e4e7" strokeDasharray="2 2" vertical={false} />
                <XAxis
                  dataKey="label"
                  interval={5}
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
                <Tooltip content={<ChartTooltip unit="MW" />} />
                <ReferenceLine
                  y={demand}
                  stroke="#a1a1aa"
                  strokeDasharray="4 4"
                />
                <Area
                  dataKey="forecast"
                  name="Forecast wind"
                  stroke="#ff5500"
                  fill="#ff5500"
                  fillOpacity={0.08}
                  connectNulls={false}
                />
                <Line
                  dataKey="demand_mw"
                  name="Illustrative demand"
                  stroke="#71717a"
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  dataKey="requirement"
                  name="Additional procurement"
                  stroke="#18181b"
                  strokeWidth={1.8}
                  dot={false}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Advisory & Methodology Note */}
      <div className="flex items-start gap-3 rounded-md border border-amber-200/80 bg-amber-50/40 p-4 shadow-2xs">
        <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-ink-700 leading-relaxed">
          <strong className="font-semibold text-ink-950">Simplified procurement estimate:</strong>{' '}
          Additional Procurement = Demand Baseline − Forecast Wind Generation, integrated over 30-minute intervals.
          A negative value indicates expected wind generation exceeds this illustrative baseline.
          This model does not include thermal generation, nuclear, interconnection, hydro, battery storage, network transmission constraints, system inertia, or dynamic market prices.
          It serves as analytical decision support, not an automated dispatch system.
        </div>
      </div>
    </div>
  );
}
