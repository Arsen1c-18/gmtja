import { stampFmt, numFmt } from '../../utils/formatters';

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | null;
    color?: string;
    payload?: {
      fullTime?: string;
      forecast_publish_time?: string | null;
      horizon_hours?: number | null;
      publish_time?: string;
      [key: string]: unknown;
    };
  }>;
  label?: string;
  unit?: string;
}

export function ChartTooltip({ active, payload, label, unit = 'MW' }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload;
  const title = row?.fullTime || (row?.publish_time ? stampFmt.format(new Date(row.publish_time)) : label);

  return (
    <div className="rounded-md border border-ink-200/90 bg-white/95 p-3 shadow-md text-xs font-sans max-w-xs backdrop-blur-sm">
      <div className="font-semibold text-ink-950 pb-1.5 border-b border-ink-100">
        {title}
      </div>
      <div className="pt-1.5 space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-ink-700">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full inline-block shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-ink-600">{entry.name}:</span>
            </span>
            <span className="font-mono font-semibold text-ink-900">
              {entry.value == null ? '—' : `${numFmt.format(entry.value)} ${unit}`}
            </span>
          </div>
        ))}
      </div>
      {row?.forecast_publish_time && (
        <div className="mt-2 pt-1.5 border-t border-ink-100 text-[11px] text-ink-500 font-mono">
          Forecast published: {stampFmt.format(new Date(row.forecast_publish_time))}
        </div>
      )}
    </div>
  );
}
