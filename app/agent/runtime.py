from app.db import connect, audit
from app.gateway import Gateway

class AgentRuntime:
    def __init__(self):
        self.gateway = Gateway()

    async def run(self, prompt: str, provider: str | None = None):
        with connect() as db:
            cur = db.execute("INSERT INTO tasks(prompt,status) VALUES(?,?)",(prompt,"running"))
            task_id = cur.lastrowid
        try:
            result, used = await self.gateway.generate(prompt, provider)
            with connect() as db:
                db.execute("UPDATE tasks SET status='completed',result=? WHERE id=?",(result,task_id))
            audit("task.completed", f"id={task_id};provider={used}")
            return {"id":task_id,"status":"completed","result":result,"provider":used}
        except Exception as exc:
            with connect() as db:
                db.execute("UPDATE tasks SET status='failed',result=? WHERE id=?",(str(exc),task_id))
            audit("task.failed", f"id={task_id};error={type(exc).__name__}")
            raise
