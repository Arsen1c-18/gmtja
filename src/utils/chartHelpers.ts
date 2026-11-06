import type { Interval, ForecastVersion } from '../types';
import { timeFmt } from './formatters';

export interface MergedIntervalRow extends Interval {
  time: number;
  label: string;
  fullTime: string;
  forecast: number | null;
  actual: number | null;
  demand_mw?: number;
  requirement?: number | null;
}

export function mergeChartIntervals(
  intervals: Interval[],
  version: ForecastVersion | null
): MergedIntervalRow[] {
  const versionMap = new Map(
    (version?.intervals ?? []).map((i) => [Date.parse(i.start_time), i.forecast_mw])
  );

  return intervals.map((i) => {
    const timestamp = Date.parse(i.start_time);
    const dateObj = new Date(i.start_time);
    return {
      ...i,
      time: timestamp,
      label: timeFmt.format(dateObj),
      fullTime: new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/London',
      }).format(dateObj),
      forecast: versionMap.get(timestamp) ?? null,
      actual: i.actual_mw,
    };
  });
}

export function exportToCsv(rows: MergedIntervalRow[], day: string): void {
  const header = ['target_time_local', 'settlement_period', 'forecast_mw', 'actual_mw', 'error_mw', 'forecast_publish_time'];
  const body = rows.map((r, idx) => {
    const err = r.forecast != null && r.actual != null ? (r.forecast - r.actual) : '';
    return [
      `"${r.start_time}"`,
      r.settlement_period ?? idx + 1,
      r.forecast ?? '',
      r.actual ?? '',
      err,
      `"${r.forecast_publish_time ?? ''}"`,
    ].join(',');
  });

  const blob = new Blob([[header.join(','), ...body].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `elexon-wind-generation-${day}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportProcurementCsv(
  rows: (MergedIntervalRow & { demand_mw?: number; requirement?: number | null })[],
  demand: number,
  day: string
): void {
  const header = [
    'target_time_local',
    'settlement_period',
    'forecast_wind_mw',
    'demand_baseline_mw',
    'residual_procurement_mw',
    'residual_energy_mwh',
  ];
  const body = rows.map((r, idx) => {
    const req = r.requirement != null ? r.requirement : (r.forecast != null ? demand - r.forecast : '');
    const mwh = req !== '' ? (Number(req) * 0.5).toFixed(1) : '';
    return [
      `"${r.start_time}"`,
      r.settlement_period ?? idx + 1,
      r.forecast ?? '',
      demand,
      req,
      mwh,
    ].join(',');
  });

  const blob = new Blob([[header.join(','), ...body].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `procurement-residual-scenario-${demand}MW-${day}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
