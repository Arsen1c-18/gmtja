export const numFmt = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0,
});

export const compactFmt = new Intl.NumberFormat('en-GB', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const decimalFmt = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const dateFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/London',
});

export const shortDateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/London',
});

export const timeFmt = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/London',
});

export const stampFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/London',
});

export function formatNice(value: number | null | undefined, suffix = ''): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${numFmt.format(value)}${suffix}`;
}

export function formatCompact(value: number | null | undefined, suffix = ''): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${compactFmt.format(value)}${suffix}`;
}

export const JANUARY_2026_DAYS = Array.from(
  { length: 31 },
  (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`
);
