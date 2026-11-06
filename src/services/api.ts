import type { DayData, DailyMetric } from '../types';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const dayCache = new Map<string, DayData>();
let monthlyCache: { month: string; days: DailyMetric[] } | null = null;

export async function getDay(day: string, forceRefresh = false): Promise<DayData> {
  if (!forceRefresh && dayCache.has(day)) {
    return dayCache.get(day)!;
  }

  const response = await fetch(`${API}/api/days/${day}`);
  if (!response.ok) {
    let message = `API returned ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      /* keep status message */
    }
    throw new Error(message);
  }

  const data = (await response.json()) as DayData;
  dayCache.set(day, data);
  return data;
}

export async function getMonthlyAccuracy(forceRefresh = false): Promise<{ month: string; days: DailyMetric[] }> {
  if (!forceRefresh && monthlyCache) {
    return monthlyCache;
  }

  const response = await fetch(`${API}/api/analytics/monthly`);
  if (!response.ok) {
    throw new Error('Could not load monthly accuracy records.');
  }

  const result = await response.json();
  monthlyCache = result;
  return result;
}

export function clearClientCache(): void {
  dayCache.clear();
  monthlyCache = null;
}
