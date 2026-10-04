import httpx
class TelegramChannel:
    def __init__(self, token:str, timeout:int=30):
        self.token=token; self.base=f"https://api.telegram.org/bot{token}"; self.timeout=timeout
    async def send_text(self, chat_id:str, text:str):
        if not self.token: raise RuntimeError("Telegram bot token is not configured")
        async with httpx.AsyncClient(timeout=self.timeout) as c:
            r=await c.post(self.base+"/sendMessage",json={"chat_id":chat_id,"text":text})
        if r.status_code>=400: raise RuntimeError(f"Telegram error {r.status_code}: {r.text[:500]}")
        return r.json()
    @staticmethod
    def parse_update(update:dict):
        msg=update.get("message") or update.get("edited_message")
        if not msg or not msg.get("text"): return None
        return {"chat_id":str(msg["chat"]["id"]),"sender_id":str(msg.get("from",{}).get("id","")),"text":msg["text"]}
