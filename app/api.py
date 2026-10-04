from fastapi import FastAPI, Depends, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.db import connect
from app.gateway import Gateway
from app.schemas import ChatRequest, MemoryCreate, SkillCreate, SkillDecision
from app.agent.runtime import AgentRuntime
from app.learning.skills import list_skills, propose, test_skill, decide, rollback
from app.channels.telegram import TelegramChannel
from app.channels.whatsapp import WhatsAppCloudChannel
from app.core.features import catalog
from app.agent.tools import ToolRegistry

settings = get_settings()
app = FastAPI(title="Nexora Agent API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://127.0.0.1:5173","http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])

async def auth(authorization: str | None = Header(default=None)):
    if settings.api_token and authorization != f"Bearer {settings.api_token}":
        raise HTTPException(status_code=401, detail="Invalid or missing bearer token")

@app.get("/health")
async def health(): return {"status":"ok","service":"nexora-agent"}

@app.get("/v1/providers", dependencies=[Depends(auth)])
async def providers():
    return {"default":settings.default_provider,"providers":[{"id":"local","enabled":settings.litert_enabled},{"id":"claude","enabled":bool(settings.anthropic_api_key)}]}

@app.get("/v1/models", dependencies=[Depends(auth)])
async def models():
    return {"models":[{"id":"local","provider":"local"},{"id":settings.claude_model,"provider":"claude"}]}

@app.post("/v1/chat/completions", dependencies=[Depends(auth)])
async def chat(body: ChatRequest):
    try:
        answer, provider = await Gateway().generate(body.message,body.provider,body.system)
        return {"response":answer,"provider":provider}
    except Exception as exc: raise HTTPException(status_code=503,detail=str(exc))

@app.post("/v1/agent/run", dependencies=[Depends(auth)])
async def agent_run(body: ChatRequest):
    try: return await AgentRuntime().run(body.message,body.provider)
    except Exception as exc: raise HTTPException(status_code=503,detail=str(exc))

@app.get("/v1/agent/tasks", dependencies=[Depends(auth)])
async def tasks():
    with connect() as db: return [dict(r) for r in db.execute("SELECT * FROM tasks ORDER BY id DESC LIMIT 100")]

@app.post("/v1/agent/tasks", dependencies=[Depends(auth)])
async def agent_task_create(body: ChatRequest):
    try: return await AgentRuntime().run(body.message, body.provider)
    except Exception as exc: raise HTTPException(status_code=503, detail=str(exc))

@app.get("/v1/agent/tasks/{task_id}", dependencies=[Depends(auth)])
async def task(task_id:int):
    with connect() as db: row=db.execute("SELECT * FROM tasks WHERE id=?",(task_id,)).fetchone()
    if not row: raise HTTPException(404,"Task not found")
    return dict(row)

@app.get("/v1/agent/tasks/{task_id}/trace", dependencies=[Depends(auth)])
async def task_trace(task_id:int):
    with connect() as db:
        task=db.execute("SELECT id FROM tasks WHERE id=?", (task_id,)).fetchone()
        if not task: raise HTTPException(404,"Task not found")
        return [dict(r) for r in db.execute("SELECT * FROM task_trace WHERE task_id=? ORDER BY id", (task_id,))]

@app.post("/v1/agent/tasks/{task_id}/approve", dependencies=[Depends(auth)])
async def task_approve(task_id:int):
    try: return await AgentRuntime().approve(task_id)
    except LookupError as exc: raise HTTPException(404,str(exc))
    except ValueError as exc: raise HTTPException(409,str(exc))
    except Exception as exc: raise HTTPException(503,str(exc))

@app.post("/v1/agent/tasks/{task_id}/cancel", dependencies=[Depends(auth)])
async def task_cancel(task_id:int):
    try: return await AgentRuntime().cancel(task_id)
    except LookupError as exc: raise HTTPException(404,str(exc))

@app.get("/v1/memory/search", dependencies=[Depends(auth)])
async def memory_search(q:str=Query(min_length=1)):
    with connect() as db: rows=db.execute("SELECT * FROM memories WHERE content LIKE ? ORDER BY id DESC LIMIT 50",(f"%{q}%",)).fetchall()
    return [dict(r) for r in rows]

@app.post("/v1/memory", dependencies=[Depends(auth)])
async def memory_create(body:MemoryCreate):
    with connect() as db: cur=db.execute("INSERT INTO memories(content,kind) VALUES(?,?)",(body.content,body.kind)); mid=cur.lastrowid
    with connect() as db: return dict(db.execute("SELECT * FROM memories WHERE id=?",(mid,)).fetchone())

@app.get("/v1/skills", dependencies=[Depends(auth)])
async def skills(): return list_skills()

@app.post("/v1/skills", dependencies=[Depends(auth)])
async def skill_create(body:SkillCreate): return propose(body.name,body.description,body.instructions)

@app.post("/v1/skills/{skill_id}/test", dependencies=[Depends(auth)])
async def skill_test(skill_id:int):
    try: return test_skill(skill_id)
    except LookupError as exc: raise HTTPException(404,str(exc))

@app.post("/v1/skills/{skill_id}/decision", dependencies=[Depends(auth)])
async def skill_decision(skill_id:int, body:SkillDecision):
    try: return decide(skill_id,body.decision)
    except LookupError as exc: raise HTTPException(404,str(exc))
    except ValueError as exc: raise HTTPException(422,str(exc))

@app.post("/v1/skills/{skill_id}/rollback", dependencies=[Depends(auth)])
async def skill_rollback(skill_id:int):
    try: return rollback(skill_id)
    except LookupError as exc: raise HTTPException(404,str(exc))

@app.get("/v1/audit", dependencies=[Depends(auth)])
async def audit():
    with connect() as db: return [dict(r) for r in db.execute("SELECT * FROM audit ORDER BY id DESC LIMIT 200")]

from app.channels.telegram import TelegramChannel
from app.channels.whatsapp import WhatsAppCloudChannel

@app.get("/v1/channels", dependencies=[Depends(auth)])
async def channels():
    return {"channels":[{"id":"telegram","enabled":settings.telegram_enabled and bool(settings.telegram_bot_token)},{"id":"whatsapp","enabled":settings.whatsapp_enabled and bool(settings.whatsapp_access_token and settings.whatsapp_phone_number_id)}]}

@app.get("/v1/channels/whatsapp/webhook")
async def whatsapp_verify(mode:str=Query(default=""), token:str=Query(default=""), challenge:str=Query(default="")):
    try: return WhatsAppCloudChannel.verify(mode,token,challenge,settings.whatsapp_verify_token)
    except ValueError as exc: raise HTTPException(403,str(exc))

@app.post("/v1/channels/telegram/webhook")
async def telegram_webhook(payload:dict, x_telegram_bot_api_secret_token: str | None = Header(default=None)):
    if settings.telegram_webhook_secret and x_telegram_bot_api_secret_token != settings.telegram_webhook_secret:
        raise HTTPException(401,"Invalid Telegram webhook secret")
    item=TelegramChannel.parse_update(payload)
    if not item: return {"ok":True,"ignored":True}
    try:
        answer,_=await Gateway().generate(item["text"])
        if settings.telegram_enabled: await TelegramChannel(settings.telegram_bot_token).send_text(item["chat_id"],answer)
        return {"ok":True,"response":answer}
    except Exception as exc: raise HTTPException(503,str(exc))

@app.post("/v1/channels/whatsapp/webhook")
async def whatsapp_webhook(payload:dict):
    items=WhatsAppCloudChannel.parse_payload(payload); results=[]
    for item in items:
        try:
            answer,_=await Gateway().generate(item["text"])
            if settings.whatsapp_enabled: await WhatsAppCloudChannel(settings.whatsapp_access_token,settings.whatsapp_phone_number_id,settings.whatsapp_api_version).send_text(item["chat_id"],answer)
            results.append({"chat_id":item["chat_id"],"ok":True})
        except Exception as exc: results.append({"chat_id":item["chat_id"],"ok":False,"error":str(exc)})
    return {"ok":True,"messages":results}
\n\n@app.get("/v1/features", dependencies=[Depends(auth)])\nasync def features(): return {"features":catalog()}\n