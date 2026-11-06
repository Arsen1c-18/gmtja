import { Activity, ArrowRight, Gauge, Scale } from 'lucide-react';
import { WindTurbineSvg } from '../../components/ui/WindTurbineSvg';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { KpiCard } from '../../components/ui/KpiCard';
import { GenerationChart } from '../../components/charts/GenerationChart';
import { LegendRow } from '../../components/charts/LegendRow';
import { MarketReadPanel } from './MarketReadPanel';
import { AccuracyMini } from './AccuracyMini';
import { CoverageList } from './CoverageList';
import type { DayData } from '../../types';
import type { MergedIntervalRow } from '../../utils/chartHelpers';
import { dateFmt, formatCompact, formatNice } from '../../utils/formatters';

export interface OverviewViewProps {
  data: DayData;
  chartData: MergedIntervalRow[];
  day: string;
  dayForecastMWh: number;
  demand: number;
  shortfall: number;
  onNavigate: (section: 'explorer' | 'accuracy' | 'procurement' | 'history') => void;
}

export function OverviewView({
  data,
  chartData,
  day,
  dayForecastMWh,
  demand,
  shortfall,
  onNavigate,
}: OverviewViewProps) {
  const actualCurrent = [...data.intervals].reverse().find((i) => i.actual_mw != null)?.actual_mw;
  const deliveryDate = new Date(`${day}T12:00:00Z`);

  return (
    <div className="space-y-6">
      {/* 4-column KPI strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Day-ahead forecast"
          value={data.eligible_publish_time ? formatCompact(dayForecastMWh, ' MWh') : 'Unavailable'}
          hint={data.eligible_publish_time ? 'Forecast energy · cutoff eligible' : 'No release before the 11:00 cutoff'}
          icon={WindTurbineSvg}
        />
        <KpiCard
          label="Latest observed outturn"
          value={formatNice(actualCurrent, ' MW')}
          hint={actualCurrent == null ? 'Actuals not yet available' : 'Latest interval with a valid actual'}
          icon={Activity}
        />
        <KpiCard
          label="Forecast MAE"
          value={formatNice(data.metrics.mae_mw, ' MW')}
          hint={`${formatNice(data.metrics.count)} paired intervals`}
          icon={Gauge}
        />
        <KpiCard
          label="Scenario residual requirement"
          value={data.eligible_publish_time ? formatCompact(shortfall, ' MWh') : 'Unavailable'}
          hint={data.eligible_publish_time ? `Fixed ${formatNice(demand)} MW demand less wind` : 'No cutoff-eligible forecast'}
          icon={Scale}
          tone="warn"
        />
      </div>

      {/* Main wind profile + Market Read grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader
              title="Wind generation profile"
              subtitle={`${dateFmt.format(deliveryDate)} · half-hourly MW`}
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('explorer')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent-700 hover:text-accent-800 hover:underline cursor-pointer"
                >
                  <span>Open explorer</span>
                  <ArrowRight size={13} />
                </button>
              }
            />
            <CardContent className="flex-1">
              <LegendRow />
              <GenerationChart chartData={chartData} compactView />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <MarketReadPanel data={data} />
        </div>
      </div>

      {/* Lower grid: Accuracy mini & Coverage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AccuracyMini data={data} onNavigateToAccuracy={() => onNavigate('accuracy')} />
        <CoverageList data={data} />
      </div>
    </div>
  );
}
