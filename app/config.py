from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    host: str = "127.0.0.1"
    port: int = 8000
    database_path: str = "data/nexora.db"
    api_token: str = ""
    default_provider: str = "local"
    allow_cloud_fallback: bool = False
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-5"
    litert_enabled: bool = False
    litert_executable: str = "litert-lm"
    litert_model: str = ""
    litert_argv_json: str = "[]"
    litert_timeout_seconds: int = 120

@lru_cache
def get_settings() -> Settings:
    return Settings(_env_prefix="NEXORA_")
