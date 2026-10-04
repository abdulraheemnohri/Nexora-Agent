import json
from app.db import connect, audit, trace
from app.gateway import Gateway
from app.agent.protocol import FinalAction, ToolCallAction, parse_action
from app.agent.policy import policy_for
from app.agent.tools import ToolRegistry

ACTION_SYSTEM = """You are Nexora's agent planner. Return ONLY one JSON object.
For a final answer: {"type":"final","content":"..."}
For a tool call: {"type":"tool_call","tool":"terminal|filesystem.read|filesystem.write","arguments":{...},"reason":"..."}
Arguments: terminal uses {"command":"...","cwd":"optional relative directory"}; filesystem.read uses {"path":"relative path"}; filesystem.write uses {"path":"relative path","content":"..."}.
All paths are relative to the Nexora workspace. Never request paths outside it.
Use a tool only when needed. After a tool result, decide the next action. Never claim a tool ran unless a tool result says so.
"""

class AgentRuntime:
    def __init__(self, workspace="workspace", max_steps=8):
        self.gateway = Gateway()
        self.tools = ToolRegistry(workspace)
        self.max_steps = max_steps

    def _prompt(self, task_id):
        with connect() as db:
            task = db.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
            events = db.execute("SELECT event,data FROM task_trace WHERE task_id=? ORDER BY id", (task_id,)).fetchall()
        parts = [f"USER TASK:\n{task['prompt']}"]
        for row in events:
            parts.append(f"{row['event'].upper()}:\n{row['data']}")
        return "\n\n".join(parts)

    async def create_task(self, prompt, provider=None, status="queued"):
        with connect() as db:
            cur = db.execute("INSERT INTO tasks(prompt,status,provider) VALUES(?,?,?)", (prompt, status, provider))
            task_id = cur.lastrowid
        trace(task_id, "prompt", prompt)
        return task_id

    async def run(self, prompt, provider=None):
        task_id = await self.create_task(prompt, provider, status="running")
        return await self.execute_task(task_id, provider)

    async def execute_task(self, task_id, provider=None):
        with connect() as db:
            row = db.execute("SELECT status,provider FROM tasks WHERE id=?", (task_id,)).fetchone()
        if not row:
            raise LookupError("Task not found")
        if row["status"] == "cancelled":
            return {"id": task_id, "status": "cancelled"}
        selected = provider or row["provider"]
        with connect() as db:
            db.execute("UPDATE tasks SET status='running',provider=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", (selected, task_id))
        return await self._continue(task_id, selected)

    async def approve(self, task_id):
        with connect() as db:
            row = db.execute("SELECT pending_tool,provider,status FROM tasks WHERE id=?", (task_id,)).fetchone()
        if not row:
            raise LookupError("Task not found")
        if row["status"] != "awaiting_approval" or not row["pending_tool"]:
            raise ValueError("Task has no pending approval")
        pending = json.loads(row["pending_tool"])
        result = await self._execute(pending["tool"], pending["arguments"], approved=True)
        trace(task_id, "tool_result", json.dumps({"tool": pending["tool"], "result": result}, ensure_ascii=False))
        with connect() as db:
            db.execute("UPDATE tasks SET status='running',pending_tool=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?", (task_id,))
        return await self._continue(task_id, row["provider"])

    async def cancel(self, task_id):
        with connect() as db:
            row = db.execute("SELECT id,status FROM tasks WHERE id=?", (task_id,)).fetchone()
            if not row: raise LookupError("Task not found")
            db.execute("UPDATE tasks SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?", (task_id,))
        audit("task.cancelled", f"id={task_id}")
        return {"id": task_id, "status": "cancelled"}

    async def _continue(self, task_id, provider):
        for _ in range(self.max_steps):
            with connect() as db:
                row = db.execute("SELECT status,step_count,provider FROM tasks WHERE id=?", (task_id,)).fetchone()
            if row["status"] == "cancelled":
                return {"id": task_id, "status": "cancelled"}
            provider = provider or row["provider"]
            step = int(row["step_count"]) + 1
            answer, used = await self.gateway.generate(self._prompt(task_id), provider, ACTION_SYSTEM)
            trace(task_id, "model", answer)
            with connect() as db:
                db.execute("UPDATE tasks SET step_count=?,provider=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", (step, used, task_id))
            try:
                action = parse_action(answer)
            except ValueError as exc:
                result = {"id":task_id,"status":"failed","error":str(exc),"provider":used}
                trace(task_id, "error", str(exc))
                with connect() as db:
                    db.execute("UPDATE tasks SET status='failed',result=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", (str(exc),task_id))
                audit("task.failed", f"id={task_id};reason=invalid_action")
                return result
            if isinstance(action, FinalAction):
                with connect() as db:
                    db.execute("UPDATE tasks SET status='completed',result=?,pending_tool=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?", (action.content,task_id))
                audit("task.completed", f"id={task_id};provider={used};steps={step}")
                return {"id":task_id,"status":"completed","result":action.content,"provider":used,"steps":step}
            policy = policy_for(action.tool)
            trace(task_id, "tool_request", json.dumps(action.model_dump(), ensure_ascii=False))
            if policy.approval_required:
                pending = json.dumps({"tool":action.tool,"arguments":action.arguments}, ensure_ascii=False)
                with connect() as db:
                    db.execute("UPDATE tasks SET status='awaiting_approval',pending_tool=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", (pending,task_id))
                audit("task.awaiting_approval", f"id={task_id};tool={action.tool}")
                return {"id":task_id,"status":"awaiting_approval","tool":action.tool,"arguments":action.arguments,"reason":action.reason,"provider":used,"steps":step}
            result = await self._execute(action.tool, action.arguments, approved=False)
            trace(task_id, "tool_result", json.dumps({"tool":action.tool,"result":result}, ensure_ascii=False))
        error = "Maximum agent tool steps reached"
        with connect() as db:
            db.execute("UPDATE tasks SET status='failed',result=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", (error,task_id))
        audit("task.failed", f"id={task_id};reason=max_steps")
        return {"id":task_id,"status":"failed","error":error}

    async def _execute(self, tool, arguments, approved=False):
        if tool == "terminal":
            return await self.tools.terminal.run(arguments.get("command",""), arguments.get("cwd"), approved=approved)
        if tool == "filesystem.read":
            return {"content":self.tools.filesystem.read(arguments.get("path",""))}
        if tool == "filesystem.write":
            if not approved: raise PermissionError("Filesystem write requires explicit approval")
            return {"path":self.tools.filesystem.write(arguments.get("path",""), arguments.get("content",""))}
        raise PermissionError(f"Tool is not allowed: {tool}")
