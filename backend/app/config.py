from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    elexon_api_base: str = "https://data.elexon.co.uk/bmrs/api/v1"
    cors_origins: str = "http://localhost:5173"
    data_cache_dir: str = ".cache/elexon"
    data_cache_ttl_seconds: int = 3600
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
