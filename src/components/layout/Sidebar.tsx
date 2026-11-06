import {
  Clock3,
  Compass,
  Gauge,
  LayoutDashboard,
  Scale,
  X,
  type LucideIcon,
} from 'lucide-react';
import { WindTurbineSvg } from '../ui/WindTurbineSvg';
import { Badge } from '../ui/Badge';

export type SectionId = 'overview' | 'explorer' | 'accuracy' | 'procurement' | 'history';

export interface NavItem {
  id: SectionId;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'explorer', label: 'Forecast explorer', icon: Compass },
  { id: 'accuracy', label: 'Forecast accuracy', icon: Gauge },
  { id: 'procurement', label: 'Procurement view', icon: Scale },
  { id: 'history', label: 'Forecast history', icon: Clock3 },
];

export interface SidebarProps {
  currentSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  hasError: boolean;
}

export function Sidebar({
  currentSection,
  onSelectSection,
  isOpen,
  onClose,
  isConnected,
  hasError,
}: SidebarProps) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-200 bg-white transition-transform duration-150 ease-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:shadow-none'
        }`}
      >
        {/* Header: 56px with proper wind SVG, no marketing logo */}
        <div className="flex h-14 items-center justify-between border-b border-ink-100 px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-md bg-accent-50 text-accent-700 border border-accent-200/70 shadow-2xs">
              <WindTurbineSvg size={19} />
            </span>
            <div>
              <div className="text-sm font-bold tracking-tight text-ink-950 leading-none">
                UK Wind Energy
              </div>
              <div className="text-[10px] font-semibold tracking-wider text-ink-500 uppercase mt-0.5">
                BMRS Operations Desk
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 cursor-pointer"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Workspace navigation */}
        <div className="px-3 pt-5 pb-2">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">
            Workspace
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = currentSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onClose();
                }}
                className={`group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-accent-50 text-accent-700 font-semibold'
                    : 'text-ink-600 hover:bg-ink-100/80 hover:text-ink-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={17}
                    className={isActive ? 'text-accent-700' : 'text-ink-500 group-hover:text-ink-900'}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-600 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-ink-100 p-4 space-y-3 bg-ink-50/40">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                hasError
                  ? 'bg-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.2)]'
                  : isConnected
                  ? 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]'
                  : 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]'
              }`}
            />
            <span className="text-ink-700 text-[11px] font-medium">
              {hasError
                ? 'BMRS connection error'
                : isConnected
                ? 'BMRS data connected'
                : 'Connecting to BMRS…'}
            </span>
          </div>

          <div className="text-[11px] text-ink-500">
            Great Britain · January 2026
          </div>

          <Badge tone="accent" className="text-[10px] font-bold tracking-wider uppercase py-0.5">
            Procurement Desk
          </Badge>
        </div>
      </aside>

      {/* Scrim for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm md:hidden"
          aria-hidden="true"
        />
      )}
    </>
  );
}
