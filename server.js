import "dotenv/config";
import http from "node:http";
import {URL} from "node:url";
import {Agent} from "./src/agent.js";
import {providers} from "./src/providers.js";
import {readBody,json,sendFile,authorized} from "./src/http.js";
import {loadState,saveState} from "./src/store.js";
const state=await loadState(); const agent=new Agent(state,saveState);
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,`http://${req.headers.host||"localhost"}`);
 if(req.method==="GET"&&u.pathname==="/")return sendFile(res,"public/index.html","text/html");
 if(req.method==="GET"&&u.pathname==="/app.js")return sendFile(res,"public/app.js","text/javascript");
 if(req.method==="GET"&&u.pathname==="/style.css")return sendFile(res,"public/style.css","text/css");
 if(req.method==="GET"&&u.pathname==="/api/health")return json(res,200,{ok:true,name:"Nexora",version:"1.0.0"});
 if(!authorized(req))return json(res,401,{error:"Unauthorized"});
 if(req.method==="GET"&&u.pathname==="/api/providers")return json(res,200,await providers.status());
 if(req.method==="GET"&&u.pathname==="/api/state")return json(res,200,{memory:state.memory,skills:state.skills,tasks:state.tasks});
 if(req.method==="POST"&&u.pathname==="/api/chat"){const b=await readBody(req);return json(res,200,await agent.run(String(b.message||""),b.provider));}
 if(req.method==="POST"&&u.pathname==="/api/tasks"){const b=await readBody(req);const t=agent.create(String(b.message||""),b.provider);agent.queue(t.id);return json(res,202,t);}
 const m=u.pathname.match(/^\/api\/tasks\/([^/]+)\/(approve|cancel)$/); if(m&&req.method==="POST")return json(res,200,m[2]==="approve"?await agent.approve(m[1]):await agent.cancel(m[1]));
 if(req.method==="POST"&&u.pathname==="/api/webhooks/telegram")return json(res,200,{ok:true});
 if(req.method==="POST"&&u.pathname==="/api/webhooks/whatsapp")return json(res,200,{ok:true});
 return json(res,404,{error:"Not found"});
}catch(e){return json(res,500,{error:e.message});}});
server.listen(Number(process.env.PORT||8787),process.env.HOST||"127.0.0.1",()=>console.log("Nexora Agent running"));
