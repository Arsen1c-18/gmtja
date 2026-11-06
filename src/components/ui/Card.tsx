import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  isInteractive?: boolean;
}

export function Card({ children, className = '', isInteractive = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-md border border-ink-200/80 bg-white shadow-xs ${
        isInteractive ? 'transition-all duration-150 hover:shadow-sm hover:border-ink-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b border-ink-100 px-4 py-3.5 sm:px-6 sm:py-4 ${className}`}
      {...props}
    >
      {title || subtitle ? (
        <div className="min-w-0">
          {title && (
            <h3 className="text-base font-semibold tracking-tight text-ink-900 leading-tight">
              {title}
            </h3>
          )}
          {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
        </div>
      ) : null}
      {children}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <div className={`px-4 py-4 sm:px-6 sm:py-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div
      className={`border-t border-ink-100 bg-ink-50/40 px-4 py-3 sm:px-6 sm:py-3.5 text-xs text-ink-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
