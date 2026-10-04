import asyncio
import json
import shutil
from app.config import Settings

class LiteRTCLIProvider:
    name = "local"
    def __init__(self, settings: Settings):
        self.settings = settings
        self.executable = shutil.which(settings.litert_executable) or (settings.litert_executable if settings.litert_executable.startswith("/") else None)
        try:
            self.argv_template = json.loads(settings.litert_argv_json)
        except json.JSONDecodeError as exc:
            raise RuntimeError("NEXORA_LITERT_ARGV_JSON must be valid JSON") from exc
        if not isinstance(self.argv_template, list) or not all(isinstance(x, str) for x in self.argv_template):
            raise RuntimeError("NEXORA_LITERT_ARGV_JSON must be a JSON array of strings")

    async def doctor(self) -> dict:
        if not self.settings.litert_enabled:
            return {"enabled": False, "available": bool(self.executable), "message": "Adapter disabled"}
        if not self.executable:
            return {"enabled": True, "available": False, "message": "CLI executable not found"}
        proc = await asyncio.create_subprocess_exec(self.executable, "--help", stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT)
        try:
            output, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            return {"enabled": True, "available": False, "message": "CLI --help timed out"}
        return {"enabled": True, "available": proc.returncode == 0, "returncode": proc.returncode, "help_excerpt": output.decode("utf-8", "replace")[:3000]}

    async def generate(self, prompt: str, system: str = "") -> str:
        if not self.settings.litert_enabled:
            raise RuntimeError("LiteRT-LM adapter is disabled")
        if not self.executable:
            raise RuntimeError("LiteRT-LM executable was not found")
        if not self.argv_template:
            raise RuntimeError("Configure NEXORA_LITERT_ARGV_JSON after inspecting installed CLI --help")
        if not any("{prompt}" in part for part in self.argv_template):
            raise RuntimeError("CLI argument template must include {prompt}")
        args = [part.replace("{prompt}", prompt).replace("{system}", system).replace("{model}", self.settings.litert_model) for part in self.argv_template]
        proc = await asyncio.create_subprocess_exec(self.executable, *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=self.settings.litert_timeout_seconds)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            raise RuntimeError("LiteRT-LM subprocess timed out")
        if proc.returncode:
            raise RuntimeError(f"LiteRT-LM CLI failed ({proc.returncode}): {stderr.decode('utf-8','replace')[:2000]}")
        return stdout.decode("utf-8", "replace").strip()
