import React from 'react';
import { ArrowRight } from 'lucide-react';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hasAccentArrow?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-ink-950 text-white shadow-xs hover:bg-ink-800 active:bg-ink-950 focus-visible:ring-ink-500',
  accent:
    'bg-accent-600 text-white shadow-xs hover:bg-accent-500 active:bg-accent-700 focus-visible:ring-accent-500',
  secondary:
    'bg-ink-100 text-ink-800 hover:bg-ink-200 active:bg-ink-300 focus-visible:ring-ink-400',
  outline:
    'border border-ink-200 bg-white text-ink-800 shadow-2xs hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100 focus-visible:ring-accent-600',
  ghost:
    'text-accent-700 hover:bg-accent-50 active:bg-accent-100 focus-visible:ring-accent-600',
  dark:
    'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 focus-visible:ring-ink-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-[34px] px-3 text-xs font-medium gap-1.5',
  md: 'h-10 px-4 text-sm font-medium gap-2',
  lg: 'h-11 px-5 text-sm font-semibold gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      hasAccentArrow = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99] cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        {hasAccentArrow && (
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-white transition-transform group-hover:translate-x-0.5">
            <ArrowRight size={12} strokeWidth={2.5} />
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
