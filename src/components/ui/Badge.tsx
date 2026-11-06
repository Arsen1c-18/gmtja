import React from 'react';

export type BadgeTone = 'accent' | 'dark' | 'grey' | 'outline' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  accent: 'bg-accent-50 text-accent-700 border border-accent-200/70',
  dark: 'bg-ink-900 text-white border border-ink-900',
  grey: 'bg-ink-100 text-ink-700 border border-ink-200/60',
  outline: 'border border-ink-200 text-ink-700 bg-white shadow-2xs',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/70',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200/70',
};

export function Badge({ tone = 'grey', icon, children, className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 text-xs font-medium tracking-wide ${toneStyles[tone]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
