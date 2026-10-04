import pytest
from app.tools.terminal import TerminalTool
from app.tools.filesystem import FilesystemTool
@pytest.mark.asyncio
async def test_terminal_requires_approval(tmp_path):
    with pytest.raises(PermissionError): await TerminalTool(str(tmp_path)).run("printf ok")
@pytest.mark.asyncio
async def test_terminal_workspace(tmp_path):
    r=await TerminalTool(str(tmp_path)).run("printf ok",approved=True); assert r["stdout"]=="ok"
def test_filesystem_blocks_escape(tmp_path):
    fs=FilesystemTool(str(tmp_path))
    with pytest.raises(PermissionError): fs.read("../secret")
