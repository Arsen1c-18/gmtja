import type React from 'react';
import type { LucideIcon } from 'lucide-react';

export type KpiTone = 'default' | 'warn' | 'success' | 'danger';

export interface KpiCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon | React.ComponentType<{ size?: number; className?: string }>;
  tone?: KpiTone;
  className?: string;
}

const toneStyles: Record<KpiTone, string> = {
  default: 'border-ink-200/80 bg-white',
  warn: 'border-amber-200/80 bg-amber-50/30',
  success: 'border-emerald-200/80 bg-emerald-50/30',
  danger: 'border-rose-200/80 bg-rose-50/30',
};

const iconToneStyles: Record<KpiTone, string> = {
  default: 'text-ink-400',
  warn: 'text-amber-600',
  success: 'text-emerald-600',
  danger: 'text-rose-600',
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  className = '',
}: KpiCardProps) {
  return (
    <article
      className={`rounded-md border p-4 shadow-xs transition-shadow duration-150 hover:shadow-sm ${toneStyles[tone]} ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-600">
        <span>{label}</span>
        <Icon size={16} className={`shrink-0 ${iconToneStyles[tone]}`} />
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-ink-950 sm:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-ink-500 leading-normal">{hint}</div>
    </article>
  );
}
