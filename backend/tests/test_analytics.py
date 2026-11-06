from datetime import date

from app.analytics.wind import assemble_day, metrics, procurement


def test_metrics_and_zero_actual_mape_handling():
    result = metrics([0, 10, 20], [5, 14, 25])
    assert result["count"] == 3
    assert round(result["mae_mw"], 3) == round(14 / 3, 3)
    assert round(result["rmse_mw"], 3) == round(22 ** 0.5, 3)
    assert result["mape_pct"] == 32.5
    assert round(result["mean_bias_mw"], 3) == round(14 / 3, 3)

def test_forecast_published_after_cutoff_is_not_selected():
    actuals = [{"startTime": "2026-01-15T00:00:00Z", "fuelType": "WIND", "generation": 100}]
    forecasts = [{"publishTime": "2026-01-14T10:00:00Z", "startTime": "2026-01-15T00:00:00Z", "generation": 80},
                 {"publishTime": "2026-01-14T12:00:00Z", "startTime": "2026-01-15T00:00:00Z", "generation": 95}]
    result = assemble_day(date(2026, 1, 15), actuals, forecasts)
    assert result["eligible_publish_time"] == "2026-01-14T10:00:00+00:00"
    assert result["intervals"][0]["forecast_mw"] == 80

def test_december_publication_can_qualify_for_january_first():
    actuals = [{"startTime": "2026-01-01T00:00:00Z", "fuelType": "WIND", "generation": 50}]
    forecasts = [{"publishTime": "2025-12-31T10:30:00Z", "startTime": "2026-01-01T00:00:00Z", "generation": 45}]
    result = assemble_day(date(2026, 1, 1), actuals, forecasts)
    assert result["eligible_publish_time"] == "2025-12-31T10:30:00+00:00"
    assert result["intervals"][0]["forecast_mw"] == 45

def test_actual_duplicates_keep_most_recent_publication():
    actuals = [
        {"startTime": "2026-01-15T00:00:00Z", "publishTime": "2026-01-15T00:30:00Z",
         "settlementPeriod": 1, "fuelType": "WIND", "generation": 120},
        {"startTime": "2026-01-15T00:00:00Z", "publishTime": "2026-01-15T01:00:00Z",
         "settlementPeriod": 1, "fuelType": "WIND", "generation": 100},
    ]
    result = assemble_day(date(2026, 1, 15), actuals, [])
    assert result["actual_count"] == 1
    assert result["intervals"][0]["actual_mw"] == 100

def test_procurement_is_signed_and_converted_to_half_hour_energy():
    result = procurement([{"forecast_mw": 120, "start_time": "a"}, {"forecast_mw": 80, "start_time": "b"}], 100)
    assert result["estimated_procurement_mwh"] == 0
    assert result["peak_shortfall_mw"] == 20

def test_winter_time_change_keeps_both_repeated_local_intervals():
    actuals = [{"startTime": f"2026-10-25T{hour:02d}:{minute:02d}:00Z", "fuelType": "WIND", "generation": 10}
               for hour in range(24) for minute in (0, 30)]
    actuals.extend(
        [{"startTime": f"2026-10-24T23:{minute:02d}:00Z", "fuelType": "WIND", "generation": 10}
         for minute in (0, 30)]
    )
    result = assemble_day(date(2026, 10, 25), actuals, [])
    repeated = [row["start_time"] for row in result["intervals"] if row["start_time"].startswith("2026-10-25T01:00")]
    assert result["actual_count"] == 50
    assert len(repeated) == 2
    assert {value[-6:] for value in repeated} == {"+01:00", "+00:00"}

def test_procurement_can_be_negative_when_forecast_wind_exceeds_scenario_demand():
    result = procurement([{"forecast_mw": 120, "start_time": "a"}], 100)
    assert result["estimated_procurement_mwh"] == -10
    assert result["peak_shortfall_mw"] == 0
