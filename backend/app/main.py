from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.config import get_settings
from app.services.elexon import close_shared_http_client


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    # Release the pooled httpx connections when the process shuts down.
    await close_shared_http_client()

app = FastAPI(
    title="Northstar Wind Intelligence API",
    version="1.0.0",
    description="Elexon BMRS wind forecast and actual analytics for January 2026.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "northstar-wind-api"}

static_dir = Path(__file__).resolve().parents[1] / "static"
if static_dir.is_dir():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")
