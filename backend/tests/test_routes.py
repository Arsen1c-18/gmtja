import httpx
import pytest
from fastapi.testclient import TestClient

import app.api.routes as routes_module
import app.services.elexon as elexon_module
from app.main import app
from app.services.cache import JsonCache
from app.services.elexon import ElexonClient


def actual_row(start: str, generation: float, publish: str = "2026-01-15T09:00:00Z") -> dict:
    return {"startTime": start, "publishTime": publish, "fuelType": "WIND", "generation": generation}


def forecast_row(start: str, generation: float, publish: str) -> dict:
    return {"startTime": start, "publishTime": publish, "fuelType": "WIND", "generation": generation}


class Stubs:
    def __init__(self) -> None:
        self.actuals: list[dict] = []
        self.forecasts: list[dict] = []
        self.status: int = 200


def make_api_stub(monkeypatch: pytest.MonkeyPatch, tmp_path, stubs: Stubs, cache_ttl: int = 3600) -> None:
    """Patch routes.ElexonClient so both API requests serve the staged payloads."""

    def handler(request: httpx.Request) -> httpx.Response:
        if "FUELHH" in request.url.path:
            body: object = stubs.actuals
        elif "WINDFOR" in request.url.path:
            body = stubs.forecasts
        else:
            body = []
        return httpx.Response(stubs.status, json=body)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="https://test.local")
    stubs.client = client

    def factory() -> ElexonClient:
        cache = JsonCache(str(tmp_path / "cache"), cache_ttl)
        return ElexonClient(http=client, cache=cache)

    original_close = elexon_module.close_shared_http_client

    async def patched_close() -> None:
        await original_close()

    monkeypatch.setattr(routes_module, "ElexonClient", factory)
    monkeypatch.setattr(elexon_module, "close_shared_http_client", patched_close)


@pytest.fixture
def staging(tmp_path, monkeypatch):
    stubs = Stubs()

    def apply(status: int = 200, cache_ttl: int = 3600) -> None:
        stubs.status = status
        make_api_stub(monkeypatch, tmp_path, stubs, cache_ttl)

    return {"stubs": stubs, "stage": apply, "client": TestClient(app)}


def test_day_endpoint_returns_intervals_and_metrics(staging):
    day = "2026-01-15"
    staging["stubs"].actuals = [actual_row(f"2026-01-15T{hour:02d}:00:00Z", 100) for hour in range(2)]
    staging["stubs"].forecasts = [
        forecast_row("2026-01-15T00:00:00Z", 80, "2026-01-14T10:00:00Z"),
        forecast_row("2026-01-15T01:00:00Z", 75, "2026-01-14T10:00:00Z"),
    ]
    staging["stage"]()
    response = staging["client"].get(f"/api/days/{day}")
    assert response.status_code == 200
    body = response.json()
    assert body["date"] == day
    assert body["metrics"]["count"] == 2
    assert body["intervals"][0]["forecast_mw"] == 80
    assert body["intervals"][0]["actual_mw"] == 100
    # The hourly forecast is carried forward into the adjacent half-hour.
    assert body["intervals"][0]["forecast_mw"] == 80.0
    assert body["intervals"][1]["forecast_mw"] == 80.0  # 00:30 held from 00:00
    assert body["intervals"][2]["forecast_mw"] == 75.0


def test_rejects_dates_outside_january_2026(staging):
    staging["stage"]()
    response = staging["client"].get("/api/days/2026-02-15")
    assert response.status_code == 422
    assert "January 2026" in response.json()["detail"]


def test_procurement_endpoint_validates_demand_range(staging):
    staging["stubs"].actuals = [actual_row("2026-01-15T00:00:00Z", 90)]
    staging["stubs"].forecasts = [forecast_row("2026-01-15T00:00:00Z", 70, "2026-01-14T10:00:00Z")]
    staging["stage"]()
    ok = staging["client"].get("/api/days/2026-01-15/procurement", params={"demand_mw": 25000})
    assert ok.status_code == 200
    assert ok.json()["estimated_procurement_mwh"] == (25000 - 70) * 0.5
    bad = staging["client"].get("/api/days/2026-01-15/procurement", params={"demand_mw": 0})
    assert bad.status_code == 422


def test_upstream_failure_maps_to_502(staging):
    staging["stage"](status=502)
    response = staging["client"].get("/api/days/2026-01-15")
    assert response.status_code == 502
    assert "Elexon request failed" in response.json()["detail"]


def test_monthly_analytics_returns_31_days(staging):
    staging["stubs"].actuals = [actual_row("2026-01-15T00:00:00Z", 100)]
    staging["stubs"].forecasts = [forecast_row("2026-01-15T00:00:00Z", 90, "2026-01-14T10:00:00Z")]
    staging["stage"]()
    response = staging["client"].get("/api/analytics/monthly")
    assert response.status_code == 200
    days = response.json()["days"]
    assert len(days) == 31
    assert days[14]["date"] == "2026-01-15"
    assert days[14]["count"] == 1
