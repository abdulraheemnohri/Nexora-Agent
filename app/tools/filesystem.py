from pathlib import Path
class FilesystemTool:
    def __init__(self,workspace="workspace"):
        self.root=Path(workspace).resolve(); self.root.mkdir(parents=True,exist_ok=True)
    def path(self,relative):
        p=(self.root/relative).resolve()
        if p!=self.root and self.root not in p.parents: raise PermissionError("path escapes Nexora workspace")
        return p
    def read(self,relative,max_bytes=1000000): return self.path(relative).read_text(errors="replace")[:max_bytes]
    def write(self,relative,content):
        p=self.path(relative); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(content); return str(p)
    def list(self,relative="."): return [str(p.relative_to(self.root)) for p in self.path(relative).rglob("*") if p.is_file()]
