import { Menu, RefreshCw } from 'lucide-react';
import { CalendarDatePicker } from '../ui/CalendarDatePicker';

export interface TopbarProps {
  day: string;
  onSelectDay: (day: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenMobileNav: () => void;
}

export function Topbar({ day, onSelectDay, onRefresh, isLoading, onOpenMobileNav }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 cursor-pointer"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <nav aria-label="Breadcrumb" className="text-xs font-medium text-ink-500">
          <ol className="flex items-center gap-1.5">
            <li>National Grid ESO</li>
            <li className="text-ink-300">/</li>
            <li className="font-semibold text-ink-900">BMRS Wind Outturn</li>
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Proper Interactive Calendar Date Picker */}
        <CalendarDatePicker selectedDay={day} onSelectDay={onSelectDay} />

        {/* Refresh Action */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh data from Elexon"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-ink-200 bg-white text-ink-700 shadow-2xs hover:bg-ink-50 hover:border-ink-300 disabled:opacity-50 cursor-pointer transition-colors"
          aria-label="Refresh Elexon data"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>

        <div className="hidden sm:flex items-center gap-2 border-l border-ink-200 pl-3">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            GB system
          </span>
          <span className="text-[11px] text-ink-400">Live</span>
        </div>
      </div>
    </header>
  );
}
