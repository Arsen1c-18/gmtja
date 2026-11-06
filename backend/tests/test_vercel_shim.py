from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND_REQUIREMENTS = ROOT / "backend" / "requirements.txt"
ROOT_REQUIREMENTS = ROOT / "requirements.txt"


def _normalized(path: Path) -> set[str]:
    """Requirement specifiers with comments and blank lines dropped, names lower-cased."""
    out: set[str] = set()
    for line in path.read_text().splitlines():
        line = line.split("#", 1)[0].strip()
        if not line or line.startswith("-"):
            continue
        spec = line.split("==", 1)
        name = spec[0].strip().lower()
        version = f"=={spec[1].strip()}" if len(spec) > 1 else ""
        out.add(f"{name}{version}")
    return out


def test_vercel_root_requirements_match_backend_pins():
    assert ROOT_REQUIREMENTS.exists(), "root requirements.txt (Vercel shim) is missing"
    backend, root = _normalized(BACKEND_REQUIREMENTS), _normalized(ROOT_REQUIREMENTS)
    assert root == backend, (
        "root requirements.txt drifted from backend/requirements.txt: "
        f"backend-only={sorted(backend - root)} root-only={sorted(root - backend)}"
    )


def test_serverless_entrypoint_exists():
    assert (ROOT / "api" / "index.py").exists()
