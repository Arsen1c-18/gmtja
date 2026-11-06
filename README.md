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
- Quality: oxlint and Prettier for the frontend, Ruff for the backend (`npm run lint`, `npm run format:check`, `ruff check backend`), pytest for backend logic and API tests.
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
src/
  App.tsx                     # operator shell and view routing
  components/                 # layout shell, UI primitives and chart components
  features/                   # overview, explorer, accuracy, procurement, history views
  services/api.ts             # typed frontend API client
  types.ts                    # mirror of backend response schemas
  utils/                      # chart helpers, CSV export and formatters
  styles.css                  # entrypoint for design tokens and layout styles
```

```text
backend/app/
  analytics/wind.py       # metrics, interval alignment, procurement arithmetic
  api/routes.py           # HTTP endpoints and request validation
  models/schemas.py       # typed response models
  services/elexon.py      # pooled BMRS client and disk cache
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

Alternatively, once the virtualenv is created and activated, both processes can be driven from the project root:

```bash
npm run dev:api            # uvicorn on :8000 (requires the venv to be activated)
npm run dev              # Vite on :5173
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
| `CORS_ORIGIN_REGEX` | Optional regex for extra origins (Vercel previews) | `https://.*\.vercel\.app` |
| `DATA_CACHE_DIR` | JSON cache directory | `.cache/elexon` |
| `DATA_CACHE_TTL_SECONDS` | Cache lifetime | `3600` |

## Deployment

### Backend on Render

The repository ships a [`render.yaml`](render.yaml) blueprint describing the API web service (Python 3.13 inside `backend/`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, health check `/health`). In Render, choose **New → Blueprint**, select the repository and the service applies automatically.

Before the first deploy, provide:

- `CORS_ORIGINS` — the exact production browser origin, e.g. `https://northstar-wind.vercel.app`.
- `CORS_ORIGIN_REGEX` — the blueprint defaults to `https://.*\.vercel\.app` so Vercel preview deployments are allowed; set it empty to disable regex matching.

The default `DATA_CACHE_DIR=/tmp/elexon-cache` keeps the JSON cache inside the ephemeral instance storage, so it survives between requests but is refilled after each deploy or restart. Add a Render disk and point `DATA_CACHE_DIR` at it (Starter plan or above) when persistent caching is preferred. Confirm the deployment with `GET /health` and `GET /api/days/2026-01-15`.

### Frontend on Vercel

Import the repository; `vercel.json` pins the Vite framework preset, `npm run build` and the `dist` output. The SPA rewrite routes unknown paths to `index.html`.

- Define `VITE_API_URL` as the deployed Render API origin **before the first build**; it is a compile-time constant, so changing it later requires a redeployment.
- Node is pinned through `engines.node` in `package.json`.

### Deploy order

1. Create the Render service first to learn its `onrender.com` origin.
2. Set `VITE_API_URL` on Vercel to that origin and run the first Vercel build.
3. Add the resulting Vercel production origin to Render's `CORS_ORIGINS` (the `*.vercel.app` regex already covers previews).
4. Re-run the backend verification commands against the live services.

## Verification

```bash
cd backend && pytest -q
npm run build
npm run lint
npm run format:check
ruff check backend
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
