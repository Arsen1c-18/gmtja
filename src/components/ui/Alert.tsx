import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

const toneConfig: Record<AlertTone, { container: string; icon: typeof Info; iconColor: string }> = {
  info: {
    container: 'border-accent-200/80 bg-accent-50/70 text-accent-950',
    icon: Info,
    iconColor: 'text-accent-700',
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    icon: CheckCircle2,
    iconColor: 'text-emerald-700',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-950',
    icon: AlertTriangle,
    iconColor: 'text-amber-700',
  },
  error: {
    container: 'border-rose-200 bg-rose-50 text-rose-950',
    icon: AlertCircle,
    iconColor: 'text-rose-700',
  },
};

export function Alert({ tone = 'info', title, children, action, className = '' }: AlertProps) {
  const { container, icon: Icon, iconColor } = toneConfig[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-md border p-3.5 text-xs leading-relaxed ${container} ${className}`}
    >
      <Icon size={17} className={`shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1">
        {title && <div className="font-semibold text-ink-950 mb-0.5">{title}</div>}
        <div className="text-ink-800">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
