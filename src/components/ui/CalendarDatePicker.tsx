import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { JANUARY_2026_DAYS } from '../../utils/formatters';

export interface CalendarDatePickerProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
  className?: string;
}

export function CalendarDatePicker({
  selectedDay,
  onSelectDay,
  className = '',
}: CalendarDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentIndex = JANUARY_2026_DAYS.indexOf(selectedDay);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < JANUARY_2026_DAYS.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onSelectDay(JANUARY_2026_DAYS[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectDay(JANUARY_2026_DAYS[currentIndex + 1]);
    }
  };

  // 2026-01-01 is a Thursday
  // In Monday-first index: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  // Leading empty/disabled cells from previous month: 3 days (Dec 29, 30, 31)
  const leadingDays = [29, 30, 31];
  const daysInJan = Array.from({ length: 31 }, (_, i) => i + 1);
  // Trailing cells to fill 35 or 42 grid: 3 leading + 31 = 34 -> next is 35 (1 trailing: Feb 1)
  const trailingDays = [1];

  const currentDateObj = new Date(`${selectedDay}T12:00:00Z`);
  const formattedDayTitle = currentDateObj.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div ref={containerRef} className={`relative flex items-center gap-1.5 ${className}`}>
      {/* Step Backward Button */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={!hasPrev}
        title="Previous delivery day (Alt+Left)"
        className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-ink-200 bg-white text-ink-600 shadow-2xs hover:bg-ink-50 hover:border-ink-300 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft size={15} />
      </button>

      {/* Main Calendar Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-[34px] items-center gap-2 rounded-md border ${
          isOpen
            ? 'border-accent-700 ring-2 ring-accent-700/20'
            : 'border-ink-200 hover:border-ink-300'
        } bg-white px-3 text-xs font-semibold text-ink-900 shadow-2xs transition-all cursor-pointer`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <CalendarDays size={14} className="text-accent-700 shrink-0" />
        <span className="font-mono tracking-tight">{formattedDayTitle}</span>
        <ChevronDown
          size={13}
          className={`text-ink-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Step Forward Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!hasNext}
        title="Next delivery day (Alt+Right)"
        className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-ink-200 bg-white text-ink-600 shadow-2xs hover:bg-ink-50 hover:border-ink-300 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
        aria-label="Next day"
      >
        <ChevronRight size={15} />
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Delivery date picker"
          className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-md border border-ink-200/90 bg-white p-3.5 shadow-xl animate-fade-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-ink-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-950">
                January 2026
              </span>
              <p className="text-[10px] text-ink-500">GB Delivery Period</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-sm text-ink-400 hover:bg-ink-100 hover:text-ink-700 cursor-pointer"
              aria-label="Close calendar"
            >
              <X size={14} />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center text-[10px] font-bold text-ink-500 uppercase tracking-wider">
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
            <span>Su</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Dec 2025 leading days */}
            {leadingDays.map((d) => (
              <span
                key={`dec-${d}`}
                className="flex h-8 items-center justify-center text-[11px] font-mono text-ink-300 select-none"
              >
                {d}
              </span>
            ))}

            {/* Jan 2026 active days */}
            {daysInJan.map((dayNum) => {
              const dayStr = `2026-01-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDay === dayStr;

              return (
                <button
                  key={dayStr}
                  type="button"
                  onClick={() => {
                    onSelectDay(dayStr);
                    setIsOpen(false);
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-sm text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-ink-950 text-white font-bold shadow-xs'
                      : 'text-ink-800 hover:bg-accent-50 hover:text-accent-700 hover:font-bold'
                  }`}
                  aria-pressed={isSelected}
                >
                  {dayNum}
                </button>
              );
            })}

            {/* Feb 2026 trailing days */}
            {trailingDays.map((d) => (
              <span
                key={`feb-${d}`}
                className="flex h-8 items-center justify-center text-[11px] font-mono text-ink-300 select-none"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Quick jump presets */}
          <div className="mt-3 pt-2.5 border-t border-ink-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">
              Quick Select
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => {
                  onSelectDay('2026-01-01');
                  setIsOpen(false);
                }}
                className="rounded-sm border border-ink-200/80 bg-ink-50 px-2 py-1 text-[10px] font-semibold text-ink-700 hover:bg-ink-100 hover:text-ink-950 cursor-pointer"
              >
                01 Jan (Start)
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectDay('2026-01-15');
                  setIsOpen(false);
                }}
                className="rounded-sm border border-ink-200/80 bg-ink-50 px-2 py-1 text-[10px] font-semibold text-ink-700 hover:bg-ink-100 hover:text-ink-950 cursor-pointer"
              >
                15 Jan (Mid)
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectDay('2026-01-31');
                  setIsOpen(false);
                }}
                className="rounded-sm border border-ink-200/80 bg-ink-50 px-2 py-1 text-[10px] font-semibold text-ink-700 hover:bg-ink-100 hover:text-ink-950 cursor-pointer"
              >
                31 Jan (End)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
