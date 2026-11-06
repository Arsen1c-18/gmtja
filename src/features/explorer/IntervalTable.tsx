import { useState, useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import type { MergedIntervalRow } from '../../utils/chartHelpers';
import { formatNice, numFmt, stampFmt } from '../../utils/formatters';

export interface IntervalTableProps {
  chartData: MergedIntervalRow[];
  deliveryDate: string;
  onExportCsv: () => void;
}

export function IntervalTable({ chartData, deliveryDate, onExportCsv }: IntervalTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'errors' | 'peaks'>('all');

  const filteredRows = useMemo(() => {
    return chartData.filter((row, idx) => {
      const periodStr = String(row.settlement_period ?? idx + 1);
      const timeStr = row.label.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        periodStr.includes(searchQuery.trim()) ||
        timeStr.includes(searchQuery.trim().toLowerCase());

      if (!matchesSearch) return false;

      if (filterMode === 'errors') {
        return (
          row.forecast != null && row.actual != null && Math.abs(row.forecast - row.actual) > 500
        );
      }
      if (filterMode === 'peaks') {
        return (row.actual ?? 0) > 10000 || (row.forecast ?? 0) > 10000;
      }

      return true;
    });
  }, [chartData, searchQuery, filterMode]);

  return (
    <Card className="mt-6">
      <CardHeader
        title="Interval detail"
        subtitle={`${numFmt.format(filteredRows.length)} of ${numFmt.format(chartData.length)} settlement periods displayed`}
        action={
          <Button variant="outline" size="sm" onClick={onExportCsv} icon={<Download size={13} />}>
            Export CSV
          </Button>
        }
      />
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/40 px-4 py-2.5 sm:px-6">
        {/* Quick filter search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search period or time (e.g. '14:30' or '29')…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-ink-200 bg-white pl-8 pr-3 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 shadow-2xs focus:border-accent-700 focus:outline-none focus:ring-1 focus:ring-accent-700/20"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`rounded-sm px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
              filterMode === 'all'
                ? 'bg-ink-950 text-white'
                : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
            }`}
          >
            All periods
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('errors')}
            className={`rounded-sm px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
              filterMode === 'errors'
                ? 'bg-ink-950 text-white'
                : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
            }`}
            title="Intervals where |Forecast - Actual| > 500 MW"
          >
            Significant error (&gt;500 MW)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('peaks')}
            className={`rounded-sm px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
              filterMode === 'peaks'
                ? 'bg-ink-950 text-white'
                : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
            }`}
            title="Intervals where generation exceeded 10,000 MW"
          >
            High generation (&gt;10 GW)
          </button>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink-200/80 bg-ink-50/60 text-[11px] font-bold uppercase tracking-wider text-ink-600">
                <th className="py-2.5 pl-4 pr-3 sm:pl-6">Target time (UK)</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3 text-right">Forecast MW</th>
                <th className="py-2.5 px-3 text-right">Actual MW</th>
                <th className="py-2.5 px-3 text-right">Error MW</th>
                <th className="py-2.5 pl-3 pr-4 sm:pr-6 text-right">Forecast published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 font-mono">
              {filteredRows.map((row, index) => {
                const hasError = row.forecast != null && row.actual != null;
                const errorVal = hasError ? row.forecast! - row.actual! : null;

                return (
                  <tr
                    key={`${row.start_time}-${index}`}
                    className="hover:bg-ink-50/70 transition-colors"
                  >
                    <td className="py-2.5 pl-4 pr-3 sm:pl-6 text-ink-900 font-sans font-medium">
                      {new Intl.DateTimeFormat('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/London',
                      }).format(new Date(row.start_time))}
                    </td>
                    <td className="py-2.5 px-3 text-ink-600">
                      {row.settlement_period ?? index + 1}
                    </td>
                    <td className="py-2.5 px-3 text-right text-ink-900 font-semibold">
                      {formatNice(row.forecast)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-ink-800">
                      {formatNice(row.actual)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold ${
                        errorVal == null
                          ? 'text-ink-400'
                          : errorVal > 0
                            ? 'text-amber-700'
                            : errorVal < 0
                              ? 'text-ink-900'
                              : 'text-emerald-700'
                      }`}
                    >
                      {errorVal == null
                        ? '—'
                        : errorVal > 0
                          ? `+${formatNice(errorVal)}`
                          : formatNice(errorVal)}
                    </td>
                    <td className="py-2.5 pl-3 pr-4 sm:pr-6 text-right text-ink-500 font-sans text-[11px]">
                      {row.forecast_publish_time
                        ? stampFmt.format(new Date(row.forecast_publish_time))
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRows.length === 0 && (
            <div className="p-6">
              <EmptyState
                title="No intervals matched"
                description={`No settlement periods matched your search query '${searchQuery}' or filter on delivery date ${deliveryDate}.`}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterMode('all');
                    }}
                  >
                    Reset filters
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
