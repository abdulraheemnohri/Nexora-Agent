from dataclasses import dataclass

@dataclass(frozen=True)
class ToolPolicy:
    approval_required: bool
    description: str

POLICIES = {
    "terminal": ToolPolicy(True, "Run a shell command inside the workspace"),
    "filesystem.read": ToolPolicy(False, "Read a workspace file"),
    "filesystem.write": ToolPolicy(True, "Write a workspace file"),
}

def policy_for(tool: str) -> ToolPolicy:
    try:
        return POLICIES[tool]
    except KeyError as exc:
        raise PermissionError(f"Tool is not allowed: {tool}") from exc
