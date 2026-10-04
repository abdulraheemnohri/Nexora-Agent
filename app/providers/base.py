from typing import Protocol

class Provider(Protocol):
    name: str
    async def generate(self, prompt: str, system: str = "") -> str: ...
