from anthropic import AsyncAnthropic
from app.config import Settings

class ClaudeProvider:
    name = "claude"
    def __init__(self, settings: Settings):
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not configured")
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.claude_model

    async def generate(self, prompt: str, system: str = "") -> str:
        result = await self.client.messages.create(
            model=self.model, max_tokens=2048,
            system=system or "You are Nexora, a careful assistant.",
            messages=[{"role": "user", "content": prompt}],
        )
        return "\n".join(block.text for block in result.content if getattr(block, "type", "") == "text")
