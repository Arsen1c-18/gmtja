import React from 'react';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow = 'WIND GENERATION INTELLIGENCE',
  title,
  description,
  action,
  className = '',
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-ink-100 ${className}`}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-600 inline-block" />
            <span className="text-xs font-bold uppercase tracking-wider text-accent-700">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl leading-tight">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-sm text-ink-600">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
