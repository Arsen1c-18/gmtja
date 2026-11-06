import json
import time

from app.services.cache import JsonCache


def test_set_and_get_roundtrip(tmp_path):
    cache = JsonCache(str(tmp_path), ttl_seconds=3600)
    cache.set("key-with-any-format", {"rows": [1, 2, 3]})
    assert cache.get("key-with-any-format") == {"rows": [1, 2, 3]}


def test_expired_entry_returns_none(tmp_path):
    cache = JsonCache(str(tmp_path), ttl_seconds=1)
    cache.set("k", ["v"])
    # Backdate the saved_at timestamp past the TTL.
    path = next(tmp_path.glob("*.json"))
    record = json.loads(path.read_text())
    record["saved_at"] = time.time() - 5
    path.write_text(json.dumps(record))
    assert cache.get("k") is None


def test_corrupt_file_returns_none(tmp_path):
    cache = JsonCache(str(tmp_path), ttl_seconds=3600)
    path = tmp_path / "whatever.json"
    path.write_text("not json{")
    assert cache.get("whatever") is None


def test_cache_directory_is_created_on_set(tmp_path):
    target = tmp_path / "nested" / "cachedir"
    cache = JsonCache(str(target), ttl_seconds=3600)
    cache.set("k", None)
    assert target.is_dir()
    assert list(target.glob("*.json"))
