import asyncio
from datetime import date, datetime, time, timezone
import httpx
from app.config import get_settings
from app.services.cache import JsonCache

UTC = timezone.utc

class ElexonError(RuntimeError):
    pass

class ElexonClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.base = settings.elexon_api_base.rstrip("/")
        self.cache = JsonCache(settings.data_cache_dir, settings.data_cache_ttl_seconds)

    async def _get(self, path: str, params: dict[str, str]) -> list[dict]:
        cache_key = f"{path}?{sorted(params.items())}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                for attempt in range(3):
                    response = await client.get(f"{self.base}/{path}", params=params, headers={"Accept": "application/json"})
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
