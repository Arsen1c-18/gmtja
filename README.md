# Northstar Wind Intelligence

A procurement intelligence workspace for reviewing Great Britain wind generation forecasts, actual generation and simplified residual procurement scenarios. The application is restricted to delivery dates in January 2026 and reads actual and forecast generation from the Elexon BMRS Insights API.

## Features

- Executive view of day-ahead forecast energy, actual outturn, paired forecast error and an explicitly illustrative demand scenario.
- 30-minute interval explorer with forecast/actual overlay, publication metadata and CSV export.
- MAE, RMSE, MAPE and mean bias with error distribution and time-of-day views.
- Procurement estimate based on a configurable fixed demand input.
- Forecast version history scored against matched actual intervals.
- Europe/London delivery-day handling, including offset-aware repeated/skipped local times.
- Backend disk cache, CORS configuration and `/health` endpoint.

The product is decision support. It does not model dispatch, market prices, balancing, storage, imports, network constraints or a trading strategy.

## Technology

- Frontend: React, TypeScript, Vite, Recharts, Lucide icons and a responsive CSS implementation based on `UI_DESIGN_GUIDE.md`.
- Backend: Python, FastAPI, Pydantic, NumPy and Pandas-compatible analytics.
- Deployment: Docker Compose, Vercel static frontend support and a standalone Python API container.

## Architecture

```text
React/Vite UI ──GET──> FastAPI ──> Elexon public BMRS API
                           │
                           ├── FUELHH actual WIND outturn
                           ├── WINDFOR forecast versions by publish time
                           └── local JSON response cache
```

```text
backend/app/
  analytics/wind.py       # metrics, interval alignment, procurement arithmetic
  api/routes.py           # HTTP endpoints and request validation
  models/schemas.py       # typed response models
  services/elexon.py      # BMRS client and request cache
src/
  App.tsx                 # operator shell and workspaces
  services/api.ts         # typed frontend API client
  styles.css              # design tokens, responsive layout and chart styling
```

## Data source and API use

Elexon Insights is the exclusive generation data source. Its public Insights API requires no key. The application uses:

- `GET /datasets/FUELHH/stream?settlementDateFrom=YYYY-MM-DD&settlementDateTo=YYYY-MM-DD&fuelType=WIND` for half-hourly actual wind generation.
- `GET /datasets/WINDFOR/stream?publishDateTimeFrom=…&publishDateTimeTo=…` for forecast records with their publication and target timestamps.

Forecast publication retrieval begins on 15 December 2025 to include December releases capable of covering the first January delivery dates. January forecasts are included through 1 February UTC. The backend filters targets to the requested Europe/London delivery date. Results are JSON arrays; these stream endpoints do not document page tokens. Failed HTTP responses and malformed response envelopes are reported as errors. Invalid rows, missing timestamps and negative/non-finite generation are excluded. Duplicate rows collapse by timestamp and publication version.

The backend requests the complete forecast publication window once and caches its JSON response. This supports version comparisons while avoiding repeated monthly downloads. Cache TTL is configurable. If Elexon is unavailable, the UI shows an error and does not invent production data. There is no built-in sample mode.

WINDFOR publishes hourly target values, while FUELHH is half-hourly. For 30-minute charts and procurement arithmetic, each hourly wind forecast is carried forward unchanged into the adjacent half-hour. This is a zero-order hold of the source hourly average, preserves the hourly energy total, and is not an additional Elexon forecast observation. Tooltips and source notes retain the original publish time.

### Time and decision cutoff

All API timestamps are parsed as timezone-aware values and aligned as UTC instants. Delivery dates and display labels use `Europe/London`, not the host machine timezone. Thus a local delivery day is bounded by local midnight; seasonal transition dates can have 46 or 50 periods. ISO output preserves the applicable offset.

The day-ahead decision cutoff is 11:00 Europe/London on the preceding calendar day. The eligible forecast is the latest WINDFOR publication at or before that instant. The selected decision forecast remains empty if there is no eligible version; a later version is never substituted into the historical decision view.

The API exposes `GET /api/days/{date}` for combined interval/version analytics, plus `/actuals`, `/forecasts`, `/forecast/day-ahead`, `/accuracy` and `/procurement` subresources. `GET /api/analytics/monthly` supplies the January daily accuracy trend.

## Analytics methodology

Let `eᵢ = forecastᵢ − actualᵢ`, over matched target timestamps only:

- `MAE = mean(|eᵢ|)` in MW.
- `RMSE = sqrt(mean(eᵢ²))` in MW.
- `MAPE = mean(|eᵢ / actualᵢ|) × 100`, excluding actual values below 1 MW to avoid unstable division near zero.
- `Mean bias = mean(eᵢ)` in MW. Positive means forecast wind exceeded actual wind.
- Version horizon is estimated from publish time to the earliest target timestamp in the selected delivery-day slice.
- A fixed demand scenario computes `procurement MW = demand MW − forecast wind MW` per interval and `MWh = sum(procurement MW × 0.5 h)`. A negative interval indicates forecast wind exceeds the illustrative demand input; it is not interpreted as an export or trading action.

## Local development

Requirements: Node.js 22.12+ and Python 3.11+.

```bash
npm install
cp .env.example .env
npm run dev
```

In a second terminal:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
cd backend
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:5173`. If frontend and backend share a host, `VITE_API_URL` may be empty; otherwise point it at the API origin. Set `CORS_ORIGINS` to the exact frontend origins.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

The full application runs on `http://localhost:8000`; FastAPI serves the built frontend and the API in the same container. For local split frontend development, run `npm run dev` separately and keep `CORS_ORIGINS=http://localhost:5173`.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Browser-visible API base URL | empty (same origin) |
| `ELEXON_API_BASE` | Elexon Insights API root | `https://data.elexon.co.uk/bmrs/api/v1` |
| `CORS_ORIGINS` | Comma-separated allowed browser origins | `http://localhost:5173` |
| `DATA_CACHE_DIR` | JSON cache directory | `.cache/elexon` |
| `DATA_CACHE_TTL_SECONDS` | Cache lifetime | `3600` |

## Deployment

### Frontend on Vercel

Import the repository, set the framework to Vite, build command `npm run build`, output directory `dist`, and define `VITE_API_URL` as the deployed API origin. Add that Vercel origin to backend `CORS_ORIGINS`.

### Backend

Deploy the root Dockerfile to a Python container host (or deploy `backend/` with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`). Set `ELEXON_API_BASE`, `CORS_ORIGINS`, `DATA_CACHE_DIR` to persistent storage when available, and an appropriate cache TTL. Configure the host health check as `/health`. No deployment has been performed from this repository.

## Verification

```bash
cd backend && pytest -q
npm run build
curl http://localhost:8000/health
curl http://localhost:8000/api/days/2026-01-15
```

## Limitations and assumptions

- January 2026 is historical; the product does not imply these values are a current operational forecast.
- Elexon exposes records according to its service behavior and retention. Missing data stays missing; no interpolation or synthetic production series is created.
- The 11:00 Europe/London cutoff is an application decision point and can be changed if procurement policy specifies a different cutover.
- Forecast archive query volume and response size should be observed in deployment; persistent cache is recommended.
- MAPE can still be sensitive for low actual generation, so the application excludes actual values below 1 MW and exposes count/absolute error metrics alongside it.
- All interval quantities are interpreted as average MW across 30 minutes; energy conversion uses a 0.5-hour interval.

## AI acknowledgement

OpenAI Codex assisted with project inspection, API research, implementation and documentation. Elexon BMRS remains the source of actual and forecast generation records.
