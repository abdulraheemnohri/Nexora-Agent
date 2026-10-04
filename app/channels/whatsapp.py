import httpx
class WhatsAppCloudChannel:
    def __init__(self, token:str, phone_number_id:str, api_version:str="v23.0", timeout:int=30):
        self.token=token; self.phone_number_id=phone_number_id; self.version=api_version; self.timeout=timeout
    async def send_text(self,to:str,text:str):
        if not self.token or not self.phone_number_id: raise RuntimeError("WhatsApp credentials are not configured")
        url=f"https://graph.facebook.com/{self.version}/{self.phone_number_id}/messages"
        body={"messaging_product":"whatsapp","to":to,"type":"text","text":{"body":text}}
        async with httpx.AsyncClient(timeout=self.timeout) as c:
            r=await c.post(url,headers={"Authorization":f"Bearer {self.token}","Content-Type":"application/json"},json=body)
        if r.status_code>=400: raise RuntimeError(f"WhatsApp error {r.status_code}: {r.text[:500]}")
        return r.json()
    @staticmethod
    def verify(mode,token,challenge,verify_token):
        if mode=="subscribe" and token and token==verify_token: return challenge
        raise ValueError("Webhook verification failed")
    @staticmethod
    def parse_payload(payload:dict):
        out=[]
        for entry in payload.get("entry",[]):
            for change in entry.get("changes",[]):
                value=change.get("value",{})
                for msg in value.get("messages",[]):
                    text=((msg.get("text") or {}).get("body"))
                    if text: out.append({"chat_id":msg.get("from",""),"sender_id":msg.get("from",""),"text":text,"message_id":msg.get("id","")})
        return out
