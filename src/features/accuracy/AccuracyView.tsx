import { useMemo } from 'react';
import { Activity, BarChart3, CircleHelp, Gauge, Scale } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { KpiCard } from '../../components/ui/KpiCard';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { GenerationChart } from '../../components/charts/GenerationChart';
import { DailyAccuracyChart } from '../../components/charts/DailyAccuracyChart';
import { ErrorByTimeChart } from '../../components/charts/ErrorByTimeChart';
import { ErrorDistributionChart } from '../../components/charts/ErrorDistributionChart';
import { LegendRow } from '../../components/charts/LegendRow';
import type { DailyMetric, DayData } from '../../types';
import type { MergedIntervalRow } from '../../utils/chartHelpers';
import { formatNice } from '../../utils/formatters';

export interface AccuracyViewProps {
  data: DayData;
  errors: Array<{
    label: string;
    error: number;
    absError: number;
    time: number;
  }>;
  chartData: MergedIntervalRow[];
  monthlyMetrics: DailyMetric[] | null;
  monthlyLoading: boolean;
  monthlyError: boolean;
  onSelectDay?: (day: string) => void;
}

export function AccuracyView({
  data,
  errors,
  chartData,
  monthlyMetrics,
  monthlyLoading,
  monthlyError,
  onSelectDay,
}: AccuracyViewProps) {
  // 3-hour time buckets
  const buckets = useMemo(() => {
    return Array.from({ length: 8 }, (_, bucket) => {
      const rows = errors.filter((e) => {
        const hours = new Date(e.time).getUTCHours();
        return hours >= bucket * 3 && hours < bucket * 3 + 3;
      });
      return {
        period: `${String(bucket * 3).padStart(2, '0')}:00–${String(bucket * 3 + 3).padStart(2, '0')}:00`,
        mae: rows.length ? rows.reduce((s, e) => s + e.absError, 0) / rows.length : null,
      };
    });
  }, [errors]);

  // Error distribution histogram bins
  const distribution = useMemo(() => {
    const ranges = [-10000, -5000, -2000, -500, 500, 2000, 5000, 10000];
    return ranges.slice(0, -1).map((edge, i) => {
      const nextEdge = ranges[i + 1];
      const count = errors.filter((e) => e.error >= edge && e.error < nextEdge).length;
      return {
        bin: `${edge / 1000}k to ${nextEdge / 1000}k`,
        intervals: count,
      };
    });
  }, [errors]);

  return (
    <div className="space-y-6">
      {/* Accuracy KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="MAE"
          value={formatNice(data.metrics.mae_mw, ' MW')}
          hint="Average absolute error across matched intervals"
          icon={Gauge}
        />
        <KpiCard
          label="RMSE"
          value={formatNice(data.metrics.rmse_mw, ' MW')}
          hint="Root mean square · penalises larger misses"
          icon={Activity}
        />
        <KpiCard
          label="MAPE"
          value={formatNice(data.metrics.mape_pct, '%')}
          hint="Percentage error · actuals ≥ 1 MW only"
          icon={BarChart3}
        />
        <KpiCard
          label="Mean bias"
          value={formatNice(data.metrics.mean_bias_mw, ' MW')}
          hint="Positive = forecast exceeded outturn"
          icon={Scale}
        />
      </div>

      {/* Monthly Accuracy Trend */}
      {monthlyMetrics && (
        <Card>
          <CardHeader
            title="Daily forecast accuracy across month"
            subtitle="Day-ahead MAE across January 2026 · Click any date point to load delivery records"
          />
          <CardContent>
            <DailyAccuracyChart
              metrics={monthlyMetrics}
              selectedDate={data.date}
              onSelectDate={onSelectDay}
            />
          </CardContent>
        </Card>
      )}

      {monthlyLoading && (
        <div className="flex items-center justify-center p-6 border border-ink-200/80 rounded-md bg-white">
          <Spinner label="Loading January 2026 monthly accuracy history from Elexon records…" />
        </div>
      )}

      {monthlyError && (
        <Alert
          tone="error"
          title="Monthly records unavailable"
        >
          Monthly accuracy history could not be retrieved from the backend API. Selected-day metrics remain fully functional.
        </Alert>
      )}

      {/* Two-chart grid: Time of Day & Error Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Absolute error by time of day"
            subtitle="Mean absolute error grouped by 3-hour UTC bins"
          />
          <CardContent>
            <ErrorByTimeChart data={buckets} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Error distribution"
            subtitle="Forecast minus actual · positive values indicate over-forecast"
          />
          <CardContent>
            <ErrorDistributionChart data={distribution} />
          </CardContent>
        </Card>
      </div>

      {/* Paired Interval Performance */}
      <Card>
        <CardHeader
          title="Paired interval outturn comparison"
          subtitle="Cutoff-eligible forecast overlay with actual half-hourly generation"
        />
        <CardContent>
          <LegendRow />
          <GenerationChart chartData={chartData} compactView />
        </CardContent>
      </Card>

      {/* Methodological Guidance Note */}
      <div className="flex items-start gap-3 rounded-md border border-ink-200 bg-white p-4 shadow-2xs">
        <CircleHelp size={17} className="text-accent-700 shrink-0 mt-0.5" />
        <div className="text-xs text-ink-700 leading-relaxed">
          <strong className="font-semibold text-ink-950">How to interpret these measures:</strong>{' '}
          MAE and RMSE are expressed in Megawatts (MW); smaller values indicate tighter agreement with actuals.
          MAPE is calculated only when actual generation is at least 1 MW to avoid distortion near zero output.
          Mean bias measures systematic over- or under-forecasting (forecast minus actual).
        </div>
      </div>
    </div>
  );
}
