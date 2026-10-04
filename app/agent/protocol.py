import json
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field, ValidationError

class FinalAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["final"]
    content: str = Field(min_length=1, max_length=100000)

class ToolCallAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["tool_call"]
    tool: Literal["terminal", "filesystem.read", "filesystem.write"]
    arguments: dict[str, Any] = Field(default_factory=dict)
    reason: str = Field(default="", max_length=2000)

def _candidate(text: str) -> Any:
    raw = text.strip()
    if raw.startswith(chr(96)*3):
        raw = raw.strip(chr(96)).strip()
        if raw.startswith("json"):
            raw = raw[4:].lstrip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("Model response is not a valid Nexora action JSON")
        try:
            return json.loads(raw[start:end + 1])
        except json.JSONDecodeError as exc:
            raise ValueError("Model response contains invalid action JSON") from exc

def parse_action(text: str) -> FinalAction | ToolCallAction:
    data = _candidate(text)
    if not isinstance(data, dict):
        raise ValueError("Nexora action must be a JSON object")
    try:
        if data.get("type") == "final":
            return FinalAction.model_validate(data)
        if data.get("type") == "tool_call":
            return ToolCallAction.model_validate(data)
    except ValidationError as exc:
        raise ValueError(f"Invalid Nexora action: {exc}") from exc
    raise ValueError("Unknown Nexora action type")
