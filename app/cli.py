import asyncio
import json
import typer
import uvicorn
from rich import print
from app.config import get_settings
from app.gateway import Gateway
from app.providers.litert_cli import LiteRTCLIProvider

app = typer.Typer(help="Nexora local-first AI agent")

@app.command()
def serve():
    s=get_settings()
    uvicorn.run("app.api:app",host=s.host,port=s.port,reload=False)

@app.command()
def status():
    s=get_settings()
    print({"host":s.host,"port":s.port,"default_provider":s.default_provider,"claude_configured":bool(s.anthropic_api_key),"litert_enabled":s.litert_enabled})

@app.command()
def doctor():
    s=get_settings()
    print(asyncio.run(LiteRTCLIProvider(s).doctor()))

@app.command()
def chat(message: str, provider: str = typer.Option(None, help="local or claude")):
    try: print(asyncio.run(Gateway().generate(message,provider))[0])
    except Exception as exc: raise typer.Exit(code=1) from exc
