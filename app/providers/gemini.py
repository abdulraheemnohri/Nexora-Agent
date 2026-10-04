import httpx
from app.config import Settings

class GeminiProvider:
    name="gemini"
    def __init__(self, settings: Settings):
        self.api_key=settings.gemini_api_key
        self.model=settings.gemini_model
        self.timeout=settings.provider_timeout_seconds
        if not self.api_key: raise RuntimeError("GEMINI_API_KEY is not configured")

    async def generate(self,prompt:str,system:str="")->str:
        url=f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        body={"contents":[{"role":"user","parts":[{"text":prompt}]}]}
        if system: body["system_instruction"]={"parts":[{"text":system}]}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            r=await client.post(url,headers={"x-goog-api-key":self.api_key,"Content-Type":"application/json"},json=body)
        if r.status_code>=400: raise RuntimeError(f"gemini API error {r.status_code}: {r.text[:500]}")
        data=r.json()
        return "".join(p.get("text","") for p in data["candidates"][0]["content"]["parts"])
