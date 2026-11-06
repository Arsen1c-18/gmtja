import React from 'react';

export interface IconTileProps {
  icon: React.ReactNode;
  tone?: 'accent' | 'neutral' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const toneStyles = {
  accent: 'bg-accent-50 text-accent-700 border border-accent-200/50',
  neutral: 'bg-ink-100 text-ink-700 border border-ink-200/50',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/50',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200/50',
};

const sizeStyles = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function IconTile({ icon, tone = 'accent', size = 'md', className = '' }: IconTileProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md shrink-0 ${toneStyles[tone]} ${sizeStyles[size]} ${className}`}
    >
      {icon}
    </span>
  );
}
