import {emit} from "./events.js";
export class TaskQueue{
 constructor(agent,{concurrency=2}={}){this.agent=agent;this.concurrency=Math.max(1,Number(concurrency)||2);this.queue=[];this.active=0}
 enqueue(id){if(!this.queue.includes(id))this.queue.push(id);emit("task.queued",{id});this.pump()}
 async pump(){while(this.active<this.concurrency&&this.queue.length){const id=this.queue.shift();this.active++;const t=this.agent.state.tasks.find(x=>x.id===id);if(t&&t.status==="queued"){emit("task.started",{id});this.agent.execute(t).catch(async e=>{t.status="failed";t.error=e.message;await this.agent.save(this.agent.state);emit("task.failed",{id,error:e.message})}).finally(()=>{this.active--;emit("task.finished",{id,status:t.status});this.pump()})}else{this.active--;this.pump()}}}
}
