from app.tools.terminal import TerminalTool
from app.tools.filesystem import FilesystemTool
class ToolRegistry:
    def __init__(self,workspace="workspace"):
        self.terminal=TerminalTool(workspace); self.filesystem=FilesystemTool(workspace)
    def catalog(self):
        return {"terminal":{"description":"Run shell commands in the Nexora workspace; explicit approval required"},"filesystem":{"description":"Read/write/list files inside the Nexora workspace"}}
