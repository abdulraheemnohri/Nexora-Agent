from app.config import get_settings
from app.providers.claude import ClaudeProvider
from app.providers.litert_cli import LiteRTCLIProvider

class Gateway:
    def __init__(self):
        self.settings = get_settings()
        self.local = LiteRTCLIProvider(self.settings)

    async def generate(self, prompt: str, provider: str | None = None, system: str = "") -> tuple[str,str]:
        selected = provider or self.settings.default_provider
        if selected == "claude":
            return await ClaudeProvider(self.settings).generate(prompt, system), "claude"
        if selected == "local":
            return await self.local.generate(prompt, system), "local"
        raise ValueError(f"Unsupported provider: {selected}")
