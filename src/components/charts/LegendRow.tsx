export interface LegendItem {
  label: string;
  color: string;
  type?: 'line' | 'area' | 'dash';
}

export interface LegendRowProps {
  items?: LegendItem[];
  unit?: string;
  className?: string;
}

export function LegendRow({
  items = [
    { label: 'Day-ahead forecast', color: '#ff5500', type: 'area' },
    { label: 'Actual generation', color: '#18181b', type: 'line' },
  ],
  unit = 'MW · half-hourly average',
  className = '',
}: LegendRowProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 text-xs text-ink-600 pb-2 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        {items.map((item, idx) => (
          <span key={idx} className="inline-flex items-center gap-1.5 font-medium">
            {item.type === 'dash' ? (
              <span
                className="inline-block w-3 border-t-2 border-dashed"
                style={{ borderColor: item.color }}
              />
            ) : item.type === 'area' ? (
              <span
                className="inline-block h-2.5 w-2.5 rounded-[2px] border"
                style={{ borderColor: item.color, backgroundColor: `${item.color}33` }}
              />
            ) : (
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span>{item.label}</span>
          </span>
        ))}
      </div>
      {unit && <span className="text-ink-400 font-mono text-[11px]">{unit}</span>}
    </div>
  );
}
