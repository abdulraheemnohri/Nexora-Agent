import asyncio
from app.agent.runtime import AgentRuntime

class AgentQueue:
    def __init__(self):
        self.runtime = AgentRuntime()
        self.queue = asyncio.Queue()
        self.worker = None

    def _ensure_worker(self):
        if self.worker is None or self.worker.done():
            self.worker = asyncio.create_task(self._worker())

    async def submit(self, prompt, provider=None):
        task_id = await self.runtime.create_task(prompt, provider, status="queued")
        await self.queue.put((task_id, provider))
        self._ensure_worker()
        return {"id": task_id, "status": "queued", "provider": provider}

    async def _worker(self):
        while True:
            task_id, provider = await self.queue.get()
            try:
                await self.runtime.execute_task(task_id, provider)
            except Exception:
                # Runtime persists the detailed failure where possible.
                pass
            finally:
                self.queue.task_done()

_queue = AgentQueue()

def get_queue():
    return _queue
