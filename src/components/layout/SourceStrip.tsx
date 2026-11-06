export function SourceStrip() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink-100 bg-ink-50/50 px-4 py-2 text-[11px] font-medium text-ink-600 sm:px-6">
      <div className="flex items-center gap-1.5 font-bold tracking-wider text-ink-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
        ELEXON BMRS SOURCE
      </div>
      <div className="text-ink-400">·</div>
      <div>
        Actuals: <span className="font-semibold text-ink-800">FUELHH · WIND</span>
      </div>
      <div className="text-ink-400">·</div>
      <div>
        Forecasts: <span className="font-semibold text-ink-800">WINDFOR</span>
      </div>
      <div className="ml-auto text-ink-500 font-mono text-[10px]">Europe/London (UK local)</div>
    </div>
  );
}
