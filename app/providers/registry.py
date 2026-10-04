from app.config import Settings
from app.providers.openai_compatible import OpenAICompatibleProvider
from app.providers.gemini import GeminiProvider

def build_cloud_providers(settings: Settings):
    return {
      "openai": OpenAICompatibleProvider(settings,"openai",settings.openai_api_key,settings.openai_base_url,settings.openai_model),
      "groq": OpenAICompatibleProvider(settings,"groq",settings.groq_api_key,settings.groq_base_url,settings.groq_model),
      "openrouter": OpenAICompatibleProvider(settings,"openrouter",settings.openrouter_api_key,settings.openrouter_base_url,settings.openrouter_model),
      "together": OpenAICompatibleProvider(settings,"together",settings.together_api_key,settings.together_base_url,settings.together_model),
      "mistral": OpenAICompatibleProvider(settings,"mistral",settings.mistral_api_key,settings.mistral_base_url,settings.mistral_model),
      "gemini": GeminiProvider(settings),
    }
