import crypto from "node:crypto";
import {emit} from "./events.js";
export class Scheduler{
 constructor(state,save,queue){this.state=state;this.save=save;this.queue=queue;this.timers=new Map()}
 async add(message,delayMs,provider){const d=Math.max(1000,Number(delayMs));const j={id:crypto.randomUUID(),message:String(message),provider:provider||null,runAt:new Date(Date.now()+d).toISOString(),status:"scheduled",createdAt:new Date().toISOString()};this.state.schedules??=[];this.state.schedules.push(j);await this.save(this.state);this.arm(j);return j}
 arm(j){if(j.status!=="scheduled")return;const ms=Math.max(0,new Date(j.runAt)-Date.now());const timer=setTimeout(async()=>{try{j.status="running";await this.save(this.state);const t=this.queue.agent.create(j.message,j.provider);j.taskId=t.id;this.queue.enqueue(t.id);j.status="queued";emit("schedule.triggered",{id:j.id,taskId:t.id});await this.save(this.state)}catch(e){j.status="failed";j.error=e.message;await this.save(this.state);emit("schedule.failed",{id:j.id,error:e.message})}finally{this.timers.delete(j.id)}},Math.min(ms,2147483647));this.timers.set(j.id,timer)}
 restore(){for(const j of this.state.schedules??[])if(j.status==="scheduled")this.arm(j)}
 async cancel(id){const j=(this.state.schedules??[]).find(x=>x.id===id);if(!j)throw Error("Schedule not found");const timer=this.timers.get(id);if(timer)clearTimeout(timer);this.timers.delete(id);j.status="cancelled";await this.save(this.state);return j}
}