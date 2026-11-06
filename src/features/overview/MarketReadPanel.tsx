import { BarChart3, CircleHelp, Clock3 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import type { DayData } from '../../types';
import { compactFmt, numFmt, stampFmt } from '../../utils/formatters';

export interface MarketReadPanelProps {
  data: DayData;
}

export function MarketReadPanel({ data }: MarketReadPanelProps) {
  const latestVersion = data.versions[data.versions.length - 1];
  const latestMWh = latestVersion?.intervals.reduce(
    (sum, interval) => sum + (interval.forecast_mw ?? 0) * 0.5,
    0,
  );
  const latestStamp = data.latest_publish_time
    ? stampFmt.format(new Date(data.latest_publish_time))
    : 'No forecast version';

  return (
    <Card className="h-full">
      <CardHeader title="Market read" subtitle="Signals from the selected delivery day" />
      <CardContent className="space-y-4">
        {/* Signal block for cutoff */}
        <div className="rounded-md border border-ink-200/80 bg-ink-50/60 p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-accent-700">
            Eligible forecast · Day-ahead
          </div>
          <div className="mt-1 text-sm font-bold text-ink-950">
            {data.eligible_publish_time
              ? stampFmt.format(new Date(data.eligible_publish_time))
              : 'No eligible release'}
          </div>
          <p className="mt-1 text-xs text-ink-600 leading-relaxed">
            Latest WINDFOR publication no later than 11:00 UK time on the preceding day.
          </p>
        </div>

        {/* Latest available version */}
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 pb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              Latest available version
            </div>
            <div className="mt-0.5 text-xs font-semibold text-ink-900">
              {latestStamp}
              {latestMWh != null ? ` · ${compactFmt.format(latestMWh)} MWh` : ''}
            </div>
          </div>
          <Clock3 size={16} className="text-ink-400 shrink-0" />
        </div>

        {/* Forecast versions count */}
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 pb-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              Forecast versions
            </div>
            <div className="mt-0.5 text-xs font-semibold text-ink-900">
              {data.version_count ? numFmt.format(data.version_count) : 'No records'}
            </div>
          </div>
          <BarChart3 size={16} className="text-ink-400 shrink-0" />
        </div>

        {/* Guidance Note */}
        <div className="flex items-start gap-2.5 rounded-md bg-accent-50/50 p-2.5 text-xs text-ink-700 border border-accent-200/50">
          <CircleHelp size={15} className="text-accent-700 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-ink-600">
            The latest available version may post-date the day-ahead cutoff. Accuracy compares
            paired actual and forecast intervals.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
