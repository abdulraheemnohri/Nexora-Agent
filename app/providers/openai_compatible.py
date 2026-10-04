import httpx
from app.config import Settings

class OpenAICompatibleProvider:
    def __init__(self, settings: Settings, name: str, api_key: str, base_url: str, model: str):
        self.name=name
        self.api_key=api_key
        self.base_url=base_url.rstrip("/")
        self.model=model
        self.timeout=settings.provider_timeout_seconds

    async def generate(self, prompt: str, system: str = "") -> str:
        if not self.api_key: raise RuntimeError(f"{self.name} API key is not configured")
        payload={"model":self.model,"messages":[{"role":"system","content":system or "You are Nexora, a careful assistant."},{"role":"user","content":prompt}],"max_tokens":2048}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r=await client.post(self.base_url+"/chat/completions",headers={"Authorization":f"Bearer {self.api_key}","Content-Type":"application/json"},json=payload)
        if r.status_code >= 400: raise RuntimeError(f"{self.name} API error {r.status_code}: {r.text[:500]}")
        data=r.json()
        return data["choices"][0]["message"]["content"]
