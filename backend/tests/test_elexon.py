import asyncio
from datetime import UTC, date, datetime

import httpx
import pytest

import app.services.elexon as elexon_module
from app.services.cache import JsonCache
from app.services.elexon import REQUEST_TIMEOUT, ElexonClient


class FlakyCounter:
    """Track attempts served by the mock transport."""

    def __init__(self, fail_times: int, status: int) -> None:
        self.fail_times = fail_times
        self.status = status
        self.attempts = 0

    def handler(self, request: httpx.Request) -> httpx.Response:
        self.attempts += 1
        if self.attempts <= self.fail_times:
            return httpx.Response(self.status, headers={"Retry-After": "0"}, json=[])
        return httpx.Response(200, json=[{"startTime": "2026-01-15T00:00:00Z", "generation": 10}])


def make_client(counter: FlakyCounter, tmp_path) -> ElexonClient:
    transport = httpx.MockTransport(counter.handler)
    http = httpx.AsyncClient(transport=transport, base_url="https://test.local", timeout=REQUEST_TIMEOUT)
    return ElexonClient(http=http, cache=JsonCache(str(tmp_path / "cache"), ttl_seconds=3600))


def test_retries_transient_upstream_errors(tmp_path) -> None:
    counter = FlakyCounter(fail_times=2, status=503)
    client = make_client(counter, tmp_path)
    rows = asyncio.run(client.actuals(date(2026, 1, 15)))
    assert counter.attempts == 3
    assert rows and rows[0]["generation"] == 10


def test_exhausted_retries_raise_elexon_error(tmp_path) -> None:
    counter = FlakyCounter(fail_times=10, status=429)
    client = make_client(counter, tmp_path)
    with pytest.raises(elexon_module.ElexonError):
        asyncio.run(client.actuals(date(2026, 1, 15)))
    assert counter.attempts == 3


def test_non_array_payload_is_rejected_without_writing_cache(tmp_path) -> None:
    calls: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(200, json={"unexpected": "mapping"})

    http = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="https://test.local")
    cache = JsonCache(str(tmp_path / "cache"), ttl_seconds=3600)
    client = ElexonClient(http=http, cache=cache)
    with pytest.raises(elexon_module.ElexonError):
        asyncio.run(client.actuals(date(2026, 1, 15)))
    assert len(calls) == 1
    assert list((tmp_path / "cache").glob("*.json")) == []


def test_successful_response_caches_and_skips_network(tmp_path) -> None:
    calls: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(200, json=[{"startTime": "2026-01-15T00:00:00Z", "generation": 10}])

    http = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="https://test.local")
    cache = JsonCache(str(tmp_path / "cache"), ttl_seconds=3600)
    client = ElexonClient(http=http, cache=cache)
    first = asyncio.run(client.actuals(date(2026, 1, 15)))
    second = asyncio.run(client.actuals(date(2026, 1, 15)))
    assert len(calls) == 1
    assert first == second


def test_forecasts_window_spans_december_through_february(tmp_path) -> None:
    seen: dict[str, str] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen.update(dict(request.url.params))
        return httpx.Response(200, json=[])

    http = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="https://test.local")
    client = ElexonClient(http=http, cache=JsonCache(str(tmp_path / "cache"), ttl_seconds=3600))
    asyncio.run(client.forecasts())
    assert seen["publishDateTimeFrom"] == "2025-12-15T00:00:00Z"
    assert seen["publishDateTimeTo"] == "2026-02-01T00:00:00Z"


def test_shared_client_is_singleton() -> None:
    first = elexon_module.get_shared_http_client()
    second = elexon_module.get_shared_http_client()
    assert first is second
    asyncio.run(elexon_module.close_shared_http_client())
    third = elexon_module.get_shared_http_client()
    assert third is not first
    asyncio.run(elexon_module.close_shared_http_client())


def test_datetime_utc_alias_supported() -> None:
    # The ruff UP017 migration relies on datetime.UTC (Python 3.11+).
    assert datetime.now(UTC).tzinfo is not None
