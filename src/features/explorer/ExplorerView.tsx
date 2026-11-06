import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/FormField';
import { GenerationChart } from '../../components/charts/GenerationChart';
import { LegendRow } from '../../components/charts/LegendRow';
import { IntervalTable } from './IntervalTable';
import type { DayData, ForecastVersion } from '../../types';
import { exportToCsv, type MergedIntervalRow } from '../../utils/chartHelpers';
import { stampFmt } from '../../utils/formatters';

export interface ExplorerViewProps {
  data: DayData;
  chartData: MergedIntervalRow[];
  activeVersion: ForecastVersion | null;
  selectedVersion: string;
  onSelectVersion: (version: string) => void;
}

export function ExplorerView({
  data,
  chartData,
  activeVersion,
  selectedVersion,
  onSelectVersion,
}: ExplorerViewProps) {
  return (
    <div className="space-y-6">
      {/* Selection Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border border-ink-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-700 whitespace-nowrap">
            Forecast version:
          </label>
          <div className="w-full sm:w-80">
            <Select
              value={selectedVersion}
              onChange={(e) => onSelectVersion(e.target.value)}
            >
              <option value="cutoff">Day-ahead eligible · 11:00 cutoff</option>
              {data.versions.map((v) => (
                <option value={v.publish_time} key={v.publish_time}>
                  {stampFmt.format(new Date(v.publish_time))} ·{' '}
                  {v.horizon_hours != null ? `${v.horizon_hours.toFixed(1)}h ahead` : '—'}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge tone="accent">
            {selectedVersion === 'cutoff' ? 'DECISION VIEW' : 'VERSION COMPARISON'}
          </Badge>
          <span className="text-xs text-ink-600">
            {activeVersion
              ? `Published ${stampFmt.format(new Date(activeVersion.publish_time))}`
              : 'No forecast published before the decision cutoff'}
          </span>
        </div>
      </div>

      {/* Generation Chart Panel */}
      <Card>
        <CardHeader
          title="Wind generation by settlement interval"
          subtitle="Forecast and actual output · MW average across each 30-minute period"
        />
        <CardContent>
          <LegendRow />
          <GenerationChart chartData={chartData} />
        </CardContent>
        <CardFooter>
          Target interval is shown in UK local time Europe/London. Actuals are reported by FUELHH; forecasts by WINDFOR.
        </CardFooter>
      </Card>

      {/* Interval Table with CSV Export */}
      <IntervalTable
        chartData={chartData}
        deliveryDate={data.date}
        onExportCsv={() => exportToCsv(chartData, data.date)}
      />
    </div>
  );
}
