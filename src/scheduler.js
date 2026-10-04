import crypto from "node:crypto";
export class Scheduler{
 constructor(state,save,agent){this.state=state;this.save=save;this.agent=agent;this.timers=new Map()}
 async add(message,delayMs,provider){const d=Math.max(1000,Number(delayMs));const j={id:crypto.randomUUID(),message:String(message),provider:provider||null,runAt:new Date(Date.now()+d).toISOString(),status:"scheduled",createdAt:new Date().toISOString()};this.state.schedules??=[];this.state.schedules.push(j);await this.save(this.state);this.arm(j);return j}
 arm(j){if(j.status!=="scheduled")return;const ms=Math.max(0,new Date(j.runAt)-Date.now());const timer=setTimeout(async()=>{j.status="running";await this.save(this.state);const t=this.agent.create(j.message,j.provider);this.agent.queue(t.id);j.status="completed";j.taskId=t.id;await this.save(this.state);this.timers.delete(j.id)},Math.min(ms,2147483647));this.timers.set(j.id,timer)}
 restore(){for(const j of this.state.schedules??[])if(j.status==="scheduled")this.arm(j)}
 async cancel(id){const j=(this.state.schedules??[]).find(x=>x.id===id);if(!j)throw Error("Schedule not found");const timer=this.timers.get(id);if(timer)clearTimeout(timer);this.timers.delete(id);j.status="cancelled";await this.save(this.state);return j}
}