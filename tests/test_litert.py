import json
import pytest
from app.config import Settings
from app.providers.litert_cli import LiteRTCLIProvider

def test_rejects_invalid_argv_template():
    s=Settings(_env_file=None,litert_argv_json='{"not":"array"}')
    with pytest.raises(RuntimeError): LiteRTCLIProvider(s)

def test_disabled_provider_errors():
    s=Settings(_env_file=None,litert_enabled=False,litert_executable="/does/not/exist")
    p=LiteRTCLIProvider(s)
    with pytest.raises(RuntimeError): import asyncio; asyncio.run(p.generate("hello"))
