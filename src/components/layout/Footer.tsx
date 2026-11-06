import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-ink-100 py-6 text-xs text-ink-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
          <span>
            <strong className="font-semibold text-ink-700">Decision support only:</strong> Verify
            against official market records prior to trading actions.
          </span>
        </div>
        <div className="text-[11px] text-ink-400">
          Source: Elexon BMRS public API · Great Britain January 2026
        </div>
      </div>
    </footer>
  );
}
