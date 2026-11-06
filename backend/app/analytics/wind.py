from collections import defaultdict
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

LONDON = ZoneInfo("Europe/London")

def metrics(actual: list[float], forecast: list[float]) -> dict:
    if not actual:
        return {"count": 0, "mae_mw": None, "rmse_mw": None, "mape_pct": None, "mean_bias_mw": None}
    actual_series = pd.Series(actual, dtype="float64")
    error = pd.Series(forecast, dtype="float64") - actual_series
    valid_pct = actual_series.abs() >= 1.0
    mape_pct = None
    if valid_pct.any():
        mape_pct = float((error[valid_pct].abs() / actual_series[valid_pct].abs()).mean() * 100)
    return {"count": int(error.size), "mae_mw": float(error.abs().mean()),
            "rmse_mw": float(np.sqrt(np.square(error).mean())),
            "mape_pct": mape_pct,
            "mean_bias_mw": float(error.mean())}

def parse_ts(value: object) -> datetime | None:
    if not isinstance(value, str): return None
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if result.tzinfo is None: result = result.replace(tzinfo=UTC)
        return result.astimezone(UTC)
    except ValueError: return None

def _number(value: object) -> float | None:
    try:
        number = float(value)
        return number if np.isfinite(number) and number >= 0 else None
    except (TypeError, ValueError): return None

def assemble_day(day: date, actual_rows: list[dict], forecast_rows: list[dict]) -> dict:
    start = datetime.combine(day, time.min, LONDON).astimezone(UTC)
    end = datetime.combine(day + timedelta(days=1), time.min, LONDON).astimezone(UTC)
    actuals: dict[datetime, float] = {}
    actual_publish: dict[datetime, datetime] = {}
    settlement_periods: dict[datetime, int] = {}
    for row in actual_rows:
        target = parse_ts(row.get("startTime"))
        published = parse_ts(row.get("publishTime"))
        value = _number(row.get("generation"))
        fuel = str(row.get("fuelType", "WIND")).upper()
        if target and start <= target < end and fuel == "WIND" and value is not None:
            if target not in actual_publish or (published and published >= actual_publish[target]):
                actuals[target] = value
                if published: actual_publish[target] = published
                try: settlement_periods[target] = int(row["settlementPeriod"])
                except (KeyError, TypeError, ValueError): pass

    versions_map: dict[datetime, dict[datetime, float]] = defaultdict(dict)
    for row in forecast_rows:
        target = parse_ts(row.get("startTime"))
        published = parse_ts(row.get("publishTime"))
        value = _number(row.get("generation"))
        if target and published and start <= target < end and value is not None:
            versions_map[published][target] = value

    # WINDFOR is hourly while FUELHH is half-hourly. Carry each hourly average
    # forward to the adjacent settlement period so the demand calculation keeps
    # 30-minute energy intervals without pretending the source is more granular.
    for _published, values in list(versions_map.items()):
        targets = sorted(values)
        adjacent_gaps = [(b - a).total_seconds() for a, b in zip(targets, targets[1:], strict=False)]
        if len(targets) > 1 and min(adjacent_gaps) >= 3600:
            for target, value in list(values.items()):
                adjacent = target + timedelta(minutes=30)
                if adjacent < end and adjacent not in values:
                    values[adjacent] = value

    cutoff = datetime.combine(day - timedelta(days=1), time(11), LONDON).astimezone(UTC)
    versions = []
    for published, values in sorted(versions_map.items()):
        matched = [(actuals[t], values[t]) for t in values if t in actuals]
        horizon = (min(values) - published).total_seconds() / 3600 if values else None
        versions.append({
            "publish_time": published.isoformat(),
            "horizon_hours": max(0, horizon) if horizon is not None else None,
            "mae_mw": metrics([a for a, _ in matched], [f for _, f in matched])["mae_mw"],
            "intervals": [
                {"start_time": t.isoformat(), "forecast_mw": val, "actual_mw": actuals.get(t),
                 "forecast_publish_time": published.isoformat()}
                for t, val in sorted(values.items())
            ],
        })
    eligible = [v for v in versions if datetime.fromisoformat(v["publish_time"]) <= cutoff]
    selected = max(eligible, key=lambda v: v["publish_time"]) if eligible else None
    latest = max(versions, key=lambda v: v["publish_time"]) if versions else None
    selected_rows = {parse_ts(i["start_time"]): i for i in selected["intervals"]} if selected else {}
    timestamps = sorted(set(actuals) | set(selected_rows))
    intervals = []
    for target in timestamps:
        selected_interval = selected_rows.get(target, {})
        intervals.append({
            "start_time": target.astimezone(LONDON).isoformat(),
            "settlement_period": settlement_periods.get(target),
            "forecast_mw": selected_interval.get("forecast_mw"),
            "actual_mw": actuals.get(target),
            # ISO offset distinguishes repeated local time during the autumn clock change.
            "forecast_publish_time": selected.get("publish_time") if selected else None,
        })
    pairs = [(i["actual_mw"], i["forecast_mw"]) for i in intervals
             if i["actual_mw"] is not None and i["forecast_mw"] is not None]
    return {"date": day.isoformat(), "timezone": "Europe/London", "data_mode": "live",
            "source": "Elexon BMRS FUELHH + WINDFOR",
            "actual_count": len(actuals), "forecast_count": sum(len(v) for v in versions_map.values()),
            "selected_forecast_count": len(selected["intervals"]) if selected else 0, "version_count": len(versions),
            "cutoff": cutoff.isoformat(), "intervals": intervals, "versions": versions,
            "metrics": metrics([a for a, _ in pairs], [f for _, f in pairs]),
            "latest_publish_time": latest["publish_time"] if latest else None,
            "eligible_publish_time": selected["publish_time"] if selected else None}

def procurement(intervals: list[dict], demand_mw: float) -> dict:
    rows = []
    for interval in intervals:
        forecast = interval.get("forecast_mw")
        if forecast is not None:
            rows.append({**interval, "demand_mw": demand_mw, "procurement_mw": demand_mw - forecast})
    return {"demand_mw": demand_mw, "estimated_procurement_mwh": sum(r["procurement_mw"] * 0.5 for r in rows),
            "peak_shortfall_mw": max((max(0.0, r["procurement_mw"]) for r in rows), default=None), "intervals": rows}
