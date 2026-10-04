import "dotenv/config";
import {loadState,saveState} from "./store.js";
import {Agent} from "./agent.js";
import {TaskQueue} from "./task-queue.js";
import {Scheduler} from "./scheduler.js";
import {emit} from "./events.js";

const state=await loadState();
const config={workspace:process.env.NEXORA_WORKSPACE,maxAgentSteps:Number(process.env.NEXORA_MAX_AGENT_STEPS||20),security:{approvalMode:process.env.NEXORA_APPROVAL_MODE||"ask"}};
const agent=new Agent(state,saveState,config);
const queue=new TaskQueue(agent,{concurrency:Number(process.env.NEXORA_MAX_CONCURRENT_TASKS||2),maxRetries:Number(process.env.NEXORA_MAX_RETRIES||3)});
agent.setQueue(queue);
const scheduler=new Scheduler(state,saveState,queue);
let stopping=false;

async function shutdown(signal){
 if(stopping)return;
 stopping=true;
 emit("worker.stopping",{signal});
 await queue.drain(Number(process.env.NEXORA_WORKER_SHUTDOWN_TIMEOUT_MS||10000));
 await saveState(state);
 emit("worker.stopped",{signal});
 console.log("Nexora worker stopped");
 process.exitCode=0;
}
process.on("SIGINT",()=>void shutdown("SIGINT"));
process.on("SIGTERM",()=>void shutdown("SIGTERM"));
process.on("uncaughtException",e=>{console.error("Nexora worker error:",e);void shutdown("uncaughtException")});
process.on("unhandledRejection",e=>{console.error("Nexora worker rejection:",e);void shutdown("unhandledRejection")});

scheduler.restore();
queue.start();
emit("worker.started",{pid:process.pid,concurrency:queue.concurrency});
console.log("Nexora worker started");
while(!stopping){
 await new Promise(r=>setTimeout(r,Number(process.env.NEXORA_WORKER_POLL_MS||1000)));
 scheduler.restore();
}
