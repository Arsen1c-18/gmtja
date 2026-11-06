export type Interval = { start_time: string; settlement_period?: number | null; forecast_mw: number | null; actual_mw: number | null; forecast_publish_time: string | null };
export type ForecastVersion = { publish_time: string; horizon_hours: number | null; mae_mw: number | null; intervals: Interval[] };
export type Metrics = { count: number; mae_mw: number | null; rmse_mw: number | null; mape_pct: number | null; mean_bias_mw: number | null };
export type DayData = { date: string; timezone: string; data_mode: string; source: string; actual_count: number; forecast_count: number; selected_forecast_count: number; version_count: number; cutoff: string; latest_publish_time?: string | null; eligible_publish_time?: string | null; intervals: Interval[]; versions: ForecastVersion[]; metrics: Metrics };
export type Procurement = { demand_mw: number; estimated_procurement_mwh: number; peak_shortfall_mw: number | null; intervals: (Interval & { demand_mw: number; procurement_mw: number })[] };
export type DailyMetric = { date: string; count: number; mae_mw: number | null; rmse_mw: number | null; mape_pct: number | null; mean_bias_mw: number | null };
