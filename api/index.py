"""Vercel Python serverless entrypoint.

Vercel imports modules under `api/` and auto-detects an ASGI app variable named
`app`. The backend source lives under `backend/`, so this shim makes it
importable and re-exports the FastAPI application.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402, F401  (exported for Vercel's runtime)
