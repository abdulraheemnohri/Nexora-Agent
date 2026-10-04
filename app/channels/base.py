from dataclasses import dataclass
@dataclass
class IncomingMessage:
    channel: str
    chat_id: str
    text: str
    sender_id: str = ""
    raw: dict | None = None
