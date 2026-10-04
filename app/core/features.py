from dataclasses import dataclass
@dataclass(frozen=True)
class Feature:
    id:str
    name:str
    status:str
    description:str

FEATURES=[
 Feature("memory","Persistent memory","active","SQLite memory and search"),
 Feature("skills","Progressive skills","active","Instruction-only skills with approval and rollback"),
 Feature("delegation","Subagent delegation","planned","Isolated child-agent contexts"),
 Feature("terminal","Terminal/file tools","planned","Policy-gated local execution and file editing"),
 Feature("browser","Browser automation","planned","Local Chromium/CDP adapter"),
 Feature("vision","Vision","planned","Image input adapter"),
 Feature("voice","Voice/STT/TTS","planned","Local-first voice adapters"),
 Feature("wake_word","Wake word","planned","On-device wake listener"),
 Feature("cron","Scheduled jobs","planned","Persistent scheduled tasks"),
 Feature("hooks","Event hooks","planned","Lifecycle hooks and guardrails"),
 Feature("batch","Batch/evals","planned","Parallel evaluation and trajectory capture"),
 Feature("mcp","MCP","planned","MCP server/client registry"),
 Feature("profiles","Profiles/SOUL","planned","Persistent agent identity and profiles"),
 Feature("api","OpenAI-compatible API","active","HTTP gateway for external clients"),
 Feature("telegram","Telegram","active","Inbound/outbound bot channel"),
 Feature("whatsapp","WhatsApp","active","WhatsApp Cloud API channel"),
 Feature("mobile","Android companion","foundation","Android client and foreground-service foundation"),
]
def catalog(): return [f.__dict__ for f in FEATURES]
