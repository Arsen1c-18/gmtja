import { Activity, CircleHelp, Clock3, Gauge } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { KpiCard } from '../../components/ui/KpiCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { GenerationChart } from '../../components/charts/GenerationChart';
import { VersionTimelineChart } from '../../components/charts/VersionTimelineChart';
import { LegendRow } from '../../components/charts/LegendRow';
import type { DayData } from '../../types';
import { mergeChartIntervals } from '../../utils/chartHelpers';
import { formatNice, numFmt, stampFmt, timeFmt } from '../../utils/formatters';

export interface HistoryViewProps {
  data: DayData;
  selectedVersion: string;
  onSelectVersion: (version: string) => void;
}

export function HistoryView({ data, selectedVersion, onSelectVersion }: HistoryViewProps) {
  const versions = [...data.versions].sort((a, b) => a.publish_time.localeCompare(b.publish_time));

  const latest = versions[versions.length - 1];
  const initial = versions[0];
  const improvement =
    initial?.mae_mw != null && latest?.mae_mw != null ? initial.mae_mw - latest.mae_mw : null;

  const timelineData = versions.map((v) => ({
    publish_time: v.publish_time,
    publishedLabel: timeFmt.format(new Date(v.publish_time)),
    mae: v.mae_mw,
  }));

  const chosen =
    versions.find((v) => v.publish_time === selectedVersion) ??
    (data.eligible_publish_time
      ? versions.find((v) => v.publish_time === data.eligible_publish_time)
      : latest) ??
    null;

  const versionChartData = mergeChartIntervals(data.intervals, chosen);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Forecast publications"
          value={numFmt.format(versions.length)}
          hint="Distinct WINDFOR runs recorded"
          icon={Clock3}
        />
        <KpiCard
          label="Initial version MAE"
          value={formatNice(initial?.mae_mw, ' MW')}
          hint={initial ? stampFmt.format(new Date(initial.publish_time)) : 'No versions available'}
          icon={Gauge}
        />
        <KpiCard
          label="Latest evolution change"
          value={
            improvement == null
              ? '—'
              : `${improvement >= 0 ? '−' : '+'}${formatNice(Math.abs(improvement))} MW`
          }
          hint={
            improvement == null
              ? 'Insufficient paired records'
              : improvement >= 0
                ? 'Improvement: error reduced closer to gate'
                : 'Error expanded in later run'
          }
          icon={Activity}
        />
      </div>

      {/* MAE Evolution Timeline */}
      <Card>
        <CardHeader
          title="Forecast error progression by publication"
          subtitle="Each version scored against paired outturns across its target intervals"
        />
        <CardContent>
          <VersionTimelineChart data={timelineData} />
        </CardContent>
      </Card>

      {/* Split layout: Version List + Selected Version Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Version List: 5/12 columns */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col">
            <CardHeader
              title="Published versions"
              subtitle="Select a publication to inspect generation curve"
            />
            <CardContent className="flex-1 p-0">
              <div className="divide-y divide-ink-100 max-h-[460px] overflow-y-auto">
                {versions.map((v, i) => {
                  const isSelected = selectedVersion === v.publish_time;
                  return (
                    <button
                      key={v.publish_time}
                      type="button"
                      onClick={() => onSelectVersion(v.publish_time)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-accent-50/70 border-l-[3px] border-accent-600'
                          : 'hover:bg-ink-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Numbered mono step (Motif 2) */}
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-sm font-mono text-xs font-bold ${
                            isSelected ? 'bg-accent-600 text-white' : 'bg-ink-100 text-ink-700'
                          }`}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-ink-900">
                            {stampFmt.format(new Date(v.publish_time))}
                          </div>
                          <div className="text-[11px] text-ink-500 font-mono">
                            {v.horizon_hours != null ? `${v.horizon_hours.toFixed(1)}h ahead` : '—'}{' '}
                            · {v.intervals.length} periods
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-ink-900">
                          {formatNice(v.mae_mw, ' MW')}
                        </div>
                        <div className="text-[10px] text-ink-400 font-medium">MAE</div>
                      </div>
                    </button>
                  );
                })}

                {versions.length === 0 && (
                  <div className="p-6">
                    <EmptyState
                      title="No forecast versions"
                      description="Elexon returned no WINDFOR publications for this delivery date."
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Version Profile: 7/12 columns */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader
              title="Selected version output profile"
              subtitle={
                chosen
                  ? `Published ${stampFmt.format(new Date(chosen.publish_time))}`
                  : 'No publication selected'
              }
            />
            <CardContent className="flex-1">
              <LegendRow />
              <GenerationChart chartData={versionChartData} compactView />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Advisory Guidance */}
      <div className="flex items-start gap-3 rounded-md border border-ink-200 bg-white p-4 shadow-2xs">
        <CircleHelp size={17} className="text-accent-700 shrink-0 mt-0.5" />
        <div className="text-xs text-ink-700 leading-relaxed">
          <strong className="font-semibold text-ink-950">Publication horizon context:</strong>{' '}
          Forecast error typically trends downward as delivery approaches due to shrinking numerical
          weather horizons. Comparisons evaluate only the target periods published in each forecast
          and paired FUELHH actuals. Only versions issued prior to the 11:00 UK day-ahead cutoff are
          considered decision-eligible for day-ahead commitment.
        </div>
      </div>
    </div>
  );
}
