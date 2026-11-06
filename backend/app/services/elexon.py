import asyncio
from datetime import UTC, date, datetime, time

import httpx

from app.config import get_settings
from app.services.cache import JsonCache

# Managed hosts (Render 100s, Heroku 30s) cap responses; fail fast rather than stall a dyno.
REQUEST_TIMEOUT = 25.0

class ElexonError(RuntimeError):
    pass

# One shared AsyncClient per process so connections are pooled across requests.
# Tests inject their own transport-scoped client instead.
_shared_http: httpx.AsyncClient | None = None

def get_shared_http_client() -> httpx.AsyncClient:
    global _shared_http
    if _shared_http is None:
        _shared_http = httpx.AsyncClient(timeout=REQUEST_TIMEOUT)
    return _shared_http

async def close_shared_http_client() -> None:
    global _shared_http
    if _shared_http is not None:
        await _shared_http.aclose()
        _shared_http = None

class ElexonClient:
    def __init__(self, http: httpx.AsyncClient | None = None, cache: JsonCache | None = None) -> None:
        settings = get_settings()
        self.base = settings.elexon_api_base.rstrip("/")
        self.cache = cache or JsonCache(settings.data_cache_dir, settings.data_cache_ttl_seconds)
        self.http = http or get_shared_http_client()

    async def _get(self, path: str, params: dict[str, str]) -> list[dict]:
        cache_key = f"{path}?{sorted(params.items())}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached
        try:
            for attempt in range(3):
                response = await self.http.get(
                    f"{self.base}/{path}", params=params, headers={"Accept": "application/json"}
                )
                if response.status_code in {429, 500, 502, 503, 504} and attempt < 2:
                    retry_after = response.headers.get("Retry-After")
                    try: delay = min(10.0, max(0.5, float(retry_after))) if retry_after else 2 ** attempt
                    except ValueError: delay = 2 ** attempt
                    await asyncio.sleep(delay)
                    continue
                response.raise_for_status()
                payload = response.json()
                break
        except (httpx.HTTPError, ValueError) as exc:
            raise ElexonError(f"Elexon request failed for {path}: {exc}") from exc
        if not isinstance(payload, list):
            raise ElexonError(f"Unexpected response from {path}; expected a JSON array.")
        rows = [row for row in payload if isinstance(row, dict)]
        self.cache.set(cache_key, rows)
        return rows

    async def actuals(self, day: date) -> list[dict]:
        return await self._get("datasets/FUELHH/stream", {
            "settlementDateFrom": day.isoformat(), "settlementDateTo": day.isoformat(), "fuelType": "WIND"
        })

    async def actuals_month(self) -> list[dict]:
        return await self._get("datasets/FUELHH/stream", {
            "settlementDateFrom": "2026-01-01", "settlementDateTo": "2026-01-31", "fuelType": "WIND"
        })

    async def forecasts(self) -> list[dict]:
        # WINDFOR supports filters on publish time, preserving superseded versions.
        # Include December releases capable of forecasting the first January days.
        start = datetime.combine(date(2025, 12, 15), time.min, UTC)
        end = datetime.combine(date(2026, 2, 1), time.min, UTC)
        return await self._get("datasets/WINDFOR/stream", {
            "publishDateTimeFrom": start.isoformat().replace("+00:00", "Z"),
            "publishDateTimeTo": end.isoformat().replace("+00:00", "Z")
        })
