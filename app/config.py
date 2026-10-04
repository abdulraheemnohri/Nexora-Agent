from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config=SettingsConfigDict(env_file=".env",env_file_encoding="utf-8",extra="ignore")
    host:str="127.0.0.1"; port:int=8000; database_path:str="data/nexora.db"; api_token:str=""
    default_provider:str="local"; allow_cloud_fallback:bool=False
    anthropic_api_key:str=""; claude_model:str="claude-sonnet-4-5"
    openai_api_key:str=""; openai_base_url:str="https://api.openai.com/v1"; openai_model:str="gpt-5-mini"
    gemini_api_key:str=""; gemini_model:str="gemini-3.8-flash"
    groq_api_key:str=""; groq_base_url:str="https://api.groq.com/openai/v1"; groq_model:str="llama-3.3-70b-versatile"
    openrouter_api_key:str=""; openrouter_base_url:str="https://openrouter.ai/api/v1"; openrouter_model:str="openai/gpt-5-mini"
    together_api_key:str=""; together_base_url:str="https://api.together.xyz/v1"; together_model:str="meta-llama/Llama-3.3-70B-Instruct-Turbo"
    mistral_api_key:str=""; mistral_base_url:str="https://api.mistral.ai/v1"; mistral_model:str="mistral-large-latest"
    provider_timeout_seconds:int=120
    litert_enabled:bool=False; litert_executable:str="litert-lm"; litert_model:str=""; litert_argv_json:str="[]"; litert_timeout_seconds:int=120
    telegram_enabled:bool=False; telegram_bot_token:str=""; telegram_webhook_secret:str=""
    whatsapp_enabled:bool=False; whatsapp_access_token:str=""; whatsapp_phone_number_id:str=""; whatsapp_verify_token:str=""; whatsapp_api_version:str="v23.0"

@lru_cache
def get_settings()->Settings: return Settings(_env_prefix="NEXORA_")
