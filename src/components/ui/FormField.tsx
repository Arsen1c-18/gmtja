import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
        {label}
        {required && <span className="text-accent-700"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-md border ${
          error
            ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20'
            : 'border-ink-200 hover:border-ink-300 focus:border-accent-700 focus:ring-accent-700/20'
        } bg-white px-3.5 py-2.5 sm:py-2 text-base sm:text-sm text-ink-900 placeholder:text-ink-400 shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-ink-50 disabled:text-ink-400 ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={`w-full appearance-none rounded-md border ${
            error
              ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20'
              : 'border-ink-200 hover:border-ink-300 focus:border-accent-700 focus:ring-accent-700/20'
          } bg-white pl-3.5 pr-8 py-2.5 sm:py-2 text-base sm:text-sm text-ink-900 shadow-2xs transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-ink-50 disabled:text-ink-400 cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400">
          <ChevronDown size={14} />
        </div>
      </div>
    );
  },
);
Select.displayName = 'Select';
