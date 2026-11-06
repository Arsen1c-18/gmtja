import React from 'react';
import { Wind } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-md border border-dashed border-ink-200 bg-white px-6 py-12 text-center ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink-100 text-ink-500 mb-3">
        {icon || <Wind size={20} />}
      </div>
      <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-ink-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
