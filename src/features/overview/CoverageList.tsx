import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import type { DayData } from '../../types';
import { numFmt } from '../../utils/formatters';

export interface CoverageListProps {
  data: DayData;
}

interface CoverageItemProps {
  label: string;
  value: number;
  expected?: number;
}

function CoverageItem({ label, value, expected }: CoverageItemProps) {
  const percentage = expected ? Math.min(100, Math.round((value / expected) * 100)) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-600 font-medium">{label}</span>
        <span className="font-mono font-semibold text-ink-900">
          {numFmt.format(value)}
          {expected ? ` / ${expected}` : ''}
        </span>
      </div>
      {percentage != null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className={`h-full transition-all duration-300 ${
              percentage >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function CoverageList({ data }: CoverageListProps) {
  return (
    <Card>
      <CardHeader title="Data coverage" subtitle="Elexon records returned for this delivery day" />
      <CardContent className="space-y-4">
        <CoverageItem label="Actual generation intervals" value={data.actual_count} expected={48} />
        <CoverageItem
          label="Day-ahead forecast targets"
          value={data.selected_forecast_count}
          expected={48}
        />
        <CoverageItem label="Published forecast versions" value={data.version_count} />
      </CardContent>
      <CardFooter>
        January 2026 · UK settlement delivery days contain 48 half-hour periods.
      </CardFooter>
    </Card>
  );
}
