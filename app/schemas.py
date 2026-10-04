from typing import Literal
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=100000)
    provider: Literal["local", "claude"] | None = None
    system: str = "You are Nexora, a careful local-first assistant."

class ChatResponse(BaseModel):
    response: str
    provider: str
    model: str | None = None

class MemoryCreate(BaseModel):
    content: str = Field(min_length=1, max_length=20000)
    kind: str = "note"

class SkillCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=1, max_length=1000)
    instructions: str = Field(min_length=1, max_length=10000)

class SkillDecision(BaseModel):
    decision: Literal["approve", "reject"]
