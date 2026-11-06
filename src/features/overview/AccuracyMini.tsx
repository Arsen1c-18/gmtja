import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import type { DayData } from '../../types';
import { formatNice } from '../../utils/formatters';

export interface AccuracyMiniProps {
  data: DayData;
  onNavigateToAccuracy: () => void;
}

interface MetricTileProps {
  label: string;
  value: string;
  explanation: string;
}

function MetricTile({ label, value, explanation }: MetricTileProps) {
  return (
    <div className="rounded-md border border-ink-200/80 bg-ink-50/40 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1 text-lg font-bold tracking-tight text-ink-950 font-mono">{value}</div>
      <div className="mt-0.5 text-[11px] text-ink-500">{explanation}</div>
    </div>
  );
}

export function AccuracyMini({ data, onNavigateToAccuracy }: AccuracyMiniProps) {
  return (
    <Card>
      <CardHeader
        title="Forecast performance"
        subtitle="Selected day-ahead forecast against actuals"
        action={
          <button
            type="button"
            onClick={onNavigateToAccuracy}
            className="inline-flex items-center gap-1 text-xs font-bold text-accent-700 hover:text-accent-800 hover:underline cursor-pointer"
          >
            <span>View metrics</span>
            <ArrowRight size={13} />
          </button>
        }
      />
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricTile
            label="MAE"
            value={formatNice(data.metrics.mae_mw, ' MW')}
            explanation="Average absolute miss"
          />
          <MetricTile
            label="RMSE"
            value={formatNice(data.metrics.rmse_mw, ' MW')}
            explanation="Larger misses weighted more"
          />
          <MetricTile
            label="Bias"
            value={formatNice(data.metrics.mean_bias_mw, ' MW')}
            explanation="Positive means over-forecast"
          />
        </div>
      </CardContent>
    </Card>
  );
}
