import pytest
from app.agent.protocol import FinalAction, ToolCallAction, parse_action

def test_parse_final():
    action = parse_action('{"type":"final","content":"done"}')
    assert isinstance(action, FinalAction)
    assert action.content == "done"

def test_parse_tool_call():
    action = parse_action('{"type":"tool_call","tool":"filesystem.read","arguments":{"path":"a.txt"}}')
    assert isinstance(action, ToolCallAction)
    assert action.tool == "filesystem.read"

def test_reject_unknown():
    with pytest.raises(ValueError):
        parse_action('{"type":"tool_call","tool":"browser.open","arguments":{}}')

def test_reject_invalid_json():
    with pytest.raises(ValueError):
        parse_action("not json")
