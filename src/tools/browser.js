const endpoint=()=>String(process.env.NEXORA_BROWSER_CDP_URL||"http://127.0.0.1:9222");
async function cdpJson(pathname){const r=await fetch(endpoint()+pathname);if(!r.ok)throw Error("Browser CDP HTTP "+r.status);return r.json()}
export async function browserStatus(){return {endpoint:endpoint(),version:await cdpJson("/json/version")}}
export async function browserPages(){return cdpJson("/json/list")}
export async function browserNavigate(url,pageId){
 if(!/^https?:\/\//i.test(String(url||"")))throw Error("Valid http(s) URL required");
 const pages=await browserPages();const page=pages.find(p=>!pageId||p.id===pageId);
 if(!page?.webSocketDebuggerUrl)throw Error("No controllable browser page");
 const ws=new WebSocket(page.webSocketDebuggerUrl);const id=1;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{ws.close();reject(Error("Browser command timed out"))},15000);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id===id){clearTimeout(timer);ws.close();if(m.error)reject(Error(m.error.message));else resolve(m.result)}};
  ws.onerror=()=>{clearTimeout(timer);reject(Error("Browser WebSocket error"))};
  ws.onopen=()=>ws.send(JSON.stringify({id,method:"Page.navigate",params:{url:String(url)}}));
 });
}
export async function browserEvaluate(expression,pageId){
 const pages=await browserPages();const page=pages.find(p=>!pageId||p.id===pageId);
 if(!page?.webSocketDebuggerUrl)throw Error("No controllable browser page");
 const ws=new WebSocket(page.webSocketDebuggerUrl);const id=1;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{ws.close();reject(Error("Browser command timed out"))},15000);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id===id){clearTimeout(timer);ws.close();if(m.error)reject(Error(m.error.message));else resolve(m.result)}};
  ws.onerror=()=>{clearTimeout(timer);reject(Error("Browser WebSocket error"))};
  ws.onopen=()=>ws.send(JSON.stringify({id,method:"Runtime.evaluate",params:{expression:String(expression||""),returnByValue:true,awaitPromise:true}}));
 });
}
