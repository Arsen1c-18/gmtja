import hashlib
import json
import time
from pathlib import Path
from typing import Any


class JsonCache:
    def __init__(self, directory: str, ttl_seconds: int):
        self.directory = Path(directory)
        self.ttl_seconds = ttl_seconds

    def get(self, key: str) -> Any | None:
        path = self._path(key)
        try:
            record = json.loads(path.read_text())
            if time.time() - record["saved_at"] < self.ttl_seconds:
                return record["value"]
        except (OSError, ValueError, KeyError, TypeError):
            return None
        return None

    def set(self, key: str, value: Any) -> None:
        try:
            self.directory.mkdir(parents=True, exist_ok=True)
            self._path(key).write_text(json.dumps({"saved_at": time.time(), "value": value}))
        except OSError:
            # The cache is an optimization; API responses should still succeed.
            return

    def _path(self, key: str) -> Path:
        return self.directory / f"{hashlib.sha256(key.encode()).hexdigest()}.json"
