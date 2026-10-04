import "dotenv/config";
import http from "node:http";
import {URL} from "node:url";
import {Agent} from "./src/agent.js";
import {providers} from "./src/providers.js";
import {Memory} from "./src/memory.js";
import {Skills} from "./src/skills.js";
import {Scheduler} from "./src/scheduler.js";
import {audit} from "./src/audit.js";
import {readBody,json,sendFile,authorized} from "./src/http.js";
import {loadConfig} from "./src/config.js";
import {HERMES_FEATURES,listToolsets,listTools} from "./src/hermes.js";
import {toolsStatus,toolsetsStatus} from "./src/tool-registry.js";
import {loadState,saveState} from "./src/store.js";
import {subscribe,clientCount} from "./src/events.js";
import {TaskQueue} from "./src/task-queue.js";
import {Delegation} from "./src/delegation.js";
import {listModels,modelStatus,installModel,testModel,useModel} from "./src/litert-models.js";
const state=await loadState();
const config=await loadConfig();const agent=new Agent(state,saveState,config);const memory=new Memory(state,saveState);const skills=new Skills(state,saveState);const queue=new TaskQueue(agent,{concurrency:config.maxConcurrentTasks||2,maxRetries:Number(process.env.NEXORA_MAX_RETRIES||3)});agent.setQueue(queue);const scheduler=new Scheduler(state,saveState,queue);const delegation=new Delegation(state,saveState,queue,{maxDelegationDepth:Number(process.env.NEXORA_MAX_DELEGATION_DEPTH||2),maxChildTasks:Number(process.env.NEXORA_MAX_CHILD_TASKS||4)});scheduler.restore();queue.restore();
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,`http://${req.headers.host||"localhost"}`);
 if(req.method==="GET"&&u.pathname==="/")return sendFile(res,"public/index.html","text/html");
 if(req.method==="GET"&&u.pathname==="/app.js")return sendFile(res,"public/app.js","text/javascript");
 if(req.method==="GET"&&u.pathname==="/style.css")return sendFile(res,"public/style.css","text/css");
 if(req.method==="GET"&&u.pathname==="/api/health")return json(res,200,{ok:true,name:"Nexora",version:"1.6.0",platform:process.platform,node:process.version});
 if(req.method==="GET"&&u.pathname==="/api/events"&&!authorized(req)&&u.searchParams.get("token")!==process.env.NEXORA_API_TOKEN)return json(res,401,{error:"Unauthorized"});\n if(!authorized(req))return json(res,401,{error:"Unauthorized"});

 if(req.method==="GET"&&u.pathname==="/api/events"){res.writeHead(200,{"content-type":"text/event-stream","cache-control":"no-cache","connection":"keep-alive"});res.write("event: ready\\ndata: {}\\n\\n");const off=subscribe(res);req.on("close",off);return}
 if(req.method==="GET"&&u.pathname==="/api/models")return json(res,200,await listModels());
 const mm=u.pathname.match(/^\\/api\\/models\\/([^/]+)\\/(install|test|use)$/);if(mm&&req.method==="POST"){const id=decodeURIComponent(mm[1]);if(mm[2]==="install")return json(res,200,await installModel(id));if(mm[2]==="test")return json(res,200,await testModel(id));return json(res,200,useModel(id));}
 if(req.method==="GET"&&u.pathname.match(/^\\/api\\/models\\/[^/]+$/)){const id=decodeURIComponent(u.pathname.split("/").pop());return json(res,200,await modelStatus(id));}
 if(req.method==="GET"&&u.pathname==="/api/providers")return json(res,200,await providers.status());
 if(req.method==="GET"&&u.pathname==="/api/features")return json(res,200,{features:HERMES_FEATURES,toolsets:listToolsets(),tools:listTools()});
 if(req.method==="GET"&&u.pathname==="/api/tools")return json(res,200,toolsStatus());
 if(req.method==="GET"&&u.pathname==="/api/toolsets")return json(res,200,toolsetsStatus());
 if(req.method==="GET"&&u.pathname==="/api/config"){const safeConfig=Object.fromEntries(Object.entries(config).filter(([k])=>!/(key|secret|token|password)/i.test(k)));safeConfig.anthropicConfigured=Boolean(config.anthropicKey);safeConfig.compatibleConfigured=Boolean(config.compatibleKey);return json(res,200,safeConfig);}
 if(req.method==="GET"&&u.pathname==="/api/state")return json(res,200,{memory:state.memory,skills:state.skills,tasks:state.tasks,schedules:state.schedules,audit:state.audit,queue:queue.snapshot()});
 if(req.method==="GET"&&u.pathname==="/api/memory")return json(res,200,memory.search(u.searchParams.get("q")||"",Number(u.searchParams.get("limit")||20)));
 if(req.method==="GET"&&u.pathname==="/api/skills")return json(res,200,skills.list());
 if(req.method==="POST"&&u.pathname==="/api/chat"){const b=await readBody(req);audit(state,{event:"chat",provider:b.provider||null});await saveState(state);return json(res,200,await agent.run(String(b.message||""),b.provider));}
 if(req.method==="POST"&&u.pathname==="/api/tasks"){const b=await readBody(req);const t=agent.create(String(b.message||""),b.provider);audit(state,{event:"task_created",taskId:t.id});await saveState(state);queue.enqueue(t.id);return json(res,202,t);}
 const tm=u.pathname.match(/^\/api\/tasks\/([^/]+)\/(approve|cancel)$/);if(tm&&req.method==="POST"){const result=tm[2]==="approve"?await agent.approve(tm[1]):await agent.cancel(tm[1]);audit(state,{event:"task_"+tm[2],taskId:tm[1]});await saveState(state);return json(res,200,result)}
 if(req.method==="POST"&&u.pathname==="/api/memory"){const b=await readBody(req);return json(res,201,await memory.add(b.content,b.meta||{}))}
 if(req.method==="POST"&&u.pathname==="/api/skills/propose"){const b=await readBody(req);return json(res,201,await skills.propose(b.name,b.description,b.instructions))}
 const sm=u.pathname.match(/^\/api\/skills\/([^/]+)\/(approve|rollback)$/);if(sm&&req.method==="POST")return json(res,200,sm[2]==="approve"?await skills.approve(sm[1]):await skills.rollback(sm[1]));
 if(req.method==="POST"&&u.pathname==="/api/schedules"){const b=await readBody(req);return json(res,201,await scheduler.add(b.message,b.delayMs,b.provider))}
 const cm=u.pathname.match(/^\/api\/schedules\/([^/]+)\/cancel$/);if(cm&&req.method==="POST")return json(res,200,await scheduler.cancel(cm[1]));
 if(req.method==="GET"&&u.pathname==="/api/tasks")return json(res,200,state.tasks.slice().reverse());
 const dm=u.pathname.match(/^\/api\/tasks\/([^/]+)\/(children|aggregate|retry)$/);if(dm&&req.method==="GET"&&dm[2]!=="retry")return json(res,200,dm[2]==="children"?delegation.children(dm[1]):delegation.aggregate(dm[1]));
 if(dm&&req.method==="POST"&&dm[2]==="retry")return json(res,202,agent.retry(dm[1]));
 if(req.method==="GET"&&u.pathname==="/api/audit")return json(res,200,state.audit.slice().reverse());
 if(req.method==="POST"&&u.pathname==="/api/webhooks/telegram")return json(res,501,{ok:false,error:"Telegram channel adapter is not configured"});
 if(req.method==="POST"&&u.pathname==="/api/webhooks/whatsapp")return json(res,501,{ok:false,error:"WhatsApp channel adapter is not configured"});
 return json(res,404,{error:"Not found"});
}catch(e){return json(res,e.status||500,{error:e.message});}});
server.listen(Number(process.env.PORT||8787),process.env.HOST||"127.0.0.1",()=>console.log("Nexora Agent running"));
