export interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5 border-2',
  md: 'h-4 w-4 border-2',
  lg: 'h-5 w-5 border-2',
};

export function Spinner({ label, size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      className={`inline-flex items-center gap-2 text-xs text-ink-500 ${className}`}
    >
      <span
        className={`inline-block rounded-full border-ink-200 border-t-accent-700 animate-spin shrink-0 ${sizeClasses[size]}`}
      />
      {label && <span>{label}</span>}
      <span className="sr-only">{label || 'Loading…'}</span>
    </div>
  );
}
