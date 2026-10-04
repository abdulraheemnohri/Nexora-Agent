import asyncio, os
from pathlib import Path
class TerminalTool:
    def __init__(self,workspace="workspace",timeout=60):
        self.workspace=Path(workspace).resolve(); self.workspace.mkdir(parents=True,exist_ok=True); self.timeout=timeout
    def _cwd(self,cwd=None):
        p=(self.workspace/(cwd or ".")).resolve()
        if p!=self.workspace and self.workspace not in p.parents: raise PermissionError("cwd escapes Nexora workspace")
        return p
    async def run(self,command,cwd=None,approved=False):
        if not approved: raise PermissionError("Terminal execution requires explicit approval")
        if not command.strip(): raise ValueError("command is empty")
        proc=await asyncio.create_subprocess_shell(command,cwd=str(self._cwd(cwd)),stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.PIPE,env=dict(os.environ))
        try: out,err=await asyncio.wait_for(proc.communicate(),timeout=self.timeout)
        except asyncio.TimeoutError: proc.kill(); await proc.wait(); raise TimeoutError("terminal command timed out")
        return {"exit_code":proc.returncode,"stdout":out.decode(errors="replace"),"stderr":err.decode(errors="replace")}
