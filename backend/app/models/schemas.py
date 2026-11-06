from pydantic import BaseModel

class Interval(BaseModel):
    start_time: str
    settlement_period: int | None = None
    forecast_mw: float | None = None
    actual_mw: float | None = None
    forecast_publish_time: str | None = None

class ForecastVersion(BaseModel):
    publish_time: str
    horizon_hours: float | None = None
    mae_mw: float | None = None
    intervals: list[Interval]

class MetricSet(BaseModel):
    count: int
    mae_mw: float | None = None
    rmse_mw: float | None = None
    mape_pct: float | None = None
    mean_bias_mw: float | None = None

class DayResponse(BaseModel):
    date: str
    timezone: str = "Europe/London"
    data_mode: str
    source: str
    actual_count: int
    forecast_count: int
    selected_forecast_count: int
    version_count: int
    cutoff: str
    latest_publish_time: str | None = None
    eligible_publish_time: str | None = None
    intervals: list[Interval]
    versions: list[ForecastVersion]
    metrics: MetricSet

class ProcurementInterval(Interval):
    demand_mw: float
    procurement_mw: float

class ProcurementResponse(BaseModel):
    demand_mw: float
    estimated_procurement_mwh: float
    peak_shortfall_mw: float | None = None
    intervals: list[ProcurementInterval]
