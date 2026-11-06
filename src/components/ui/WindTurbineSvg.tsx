import React from 'react';

export interface WindSvgProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export function WindTurbineSvg({
  size = 20,
  className = '',
  ...props
}: WindSvgProps) {
  // Simple, closed-loop 3-blade fan matching the favicon tile
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Center hub */}
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />

      {/* 3 symmetrical closed fan blades (120° apart) */}
      <path
        d="M12 12C10.5 7.5 11 3.5 12.5 3.5C14 3.5 14.5 7.5 12 12Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M12 12C10.5 7.5 11 3.5 12.5 3.5C14 3.5 14.5 7.5 12 12Z"
        transform="rotate(120 12 12)"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M12 12C10.5 7.5 11 3.5 12.5 3.5C14 3.5 14.5 7.5 12 12Z"
        transform="rotate(240 12 12)"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

export { WindTurbineSvg as WindFansSvg };
