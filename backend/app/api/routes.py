import asyncio
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Query
from app.analytics.wind import assemble_day, procurement
from app.models.schemas import DayResponse, ProcurementResponse
from app.services.elexon import ElexonClient, ElexonError

router = APIRouter(prefix="/api")

@router.get("/days/{day}", response_model=DayResponse)
async def get_day(day: date):
    if day.year != 2026 or day.month != 1:
        raise HTTPException(status_code=422, detail="Select a delivery date in January 2026.")
    client = ElexonClient()
    try:
        actuals, forecasts = await asyncio.gather(client.actuals(day), client.forecasts())
    except ElexonError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return assemble_day(day, actuals, forecasts)

@router.get("/days/{day}/procurement", response_model=ProcurementResponse)
async def get_procurement(day: date, demand_mw: float = Query(30000, gt=0, le=100000)):
    data = await get_day(day)
    return procurement(data["intervals"], demand_mw)

@router.get("/days/{day}/actuals")
async def get_actuals(day: date):
    data = await get_day(day)
    return {"date": data["date"], "source": "Elexon BMRS FUELHH", "intervals": [row for row in data["intervals"] if row["actual_mw"] is not None]}

@router.get("/days/{day}/forecasts")
async def get_forecast_versions(day: date):
    data = await get_day(day)
    return {"date": data["date"], "source": "Elexon BMRS WINDFOR", "versions": data["versions"]}

@router.get("/days/{day}/forecast/day-ahead")
async def get_day_ahead_forecast(day: date):
    data = await get_day(day)
    return {"date": data["date"], "decision_cutoff": data["cutoff"], "publish_time": data["eligible_publish_time"],
            "intervals": [row for row in data["intervals"] if row["forecast_mw"] is not None]}

@router.get("/days/{day}/accuracy")
async def get_accuracy(day: date):
    data = await get_day(day)
    comparisons = [{"start_time": row["start_time"], "forecast_mw": row["forecast_mw"], "actual_mw": row["actual_mw"],
                    "error_mw": row["forecast_mw"] - row["actual_mw"]}
                   for row in data["intervals"] if row["forecast_mw"] is not None and row["actual_mw"] is not None]
    return {"date": data["date"], "metrics": data["metrics"], "comparisons": comparisons}

@router.get("/analytics/monthly")
async def get_monthly_accuracy():
    client = ElexonClient()
    try:
        actuals, forecasts = await asyncio.gather(client.actuals_month(), client.forecasts())
    except ElexonError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    days = []
    for offset in range(31):
        day = date(2026, 1, 1) + timedelta(days=offset)
        result = assemble_day(day, actuals, forecasts)
        days.append({"date": day.isoformat(), **result["metrics"]})
    return {"month": "2026-01", "days": days}
