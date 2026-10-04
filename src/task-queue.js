import {emit} from "./events.js";

export class TaskQueue{
 constructor(agent,{concurrency=2,maxRetries=3}={}){
  this.agent=agent;
  this.concurrency=Math.max(1,Number(concurrency)||2);
  this.maxRetries=Math.max(0,Number(maxRetries)||3);
  this.queue=[];
  this.active=0;
  this.running=new Set();
  this.started=false;
  this.stopping=false;
 }
 start(){if(this.started)return;this.started=true;this.stopping=false;emit("queue.started",this.snapshot());this.restore()}
 stop(){this.stopping=true;this.started=false;emit("queue.stopping",this.snapshot())}
 enqueue(id,priority=0){
  const t=this.agent.state.tasks.find(x=>x.id===id);if(!t)return null;
  if(t.status==="cancelled"||t.status==="completed")return t;
  t.priority=Number(priority||0);
  if(!this.queue.includes(id))this.queue.push(id);
  this.queue.sort((a,b)=>Number(this.agent.state.tasks.find(x=>x.id===b)?.priority||0)-Number(this.agent.state.tasks.find(x=>x.id===a)?.priority||0));
  t.status="queued";t.updatedAt=new Date().toISOString();this.agent.save(this.agent.state);
  emit("task.queued",{id,position:this.queue.indexOf(id)+1});if(this.started&&!this.stopping)this.pump();return t;
 }
 snapshot(){return{queued:[...this.queue],active:this.active,concurrency:this.concurrency,running:[...this.running],started:this.started,stopping:this.stopping}}
 restore(){
  for(const t of this.agent.state.tasks??[]){
   if(t.status==="running"||t.status==="planning"||t.status==="queued"){
    if(t.status==="running"||t.status==="planning")t.status="queued";
    if(!this.queue.includes(t.id))this.queue.push(t.id);
   }
  }
  this.queue.sort((a,b)=>Number(this.agent.state.tasks.find(x=>x.id===b)?.priority||0)-Number(this.agent.state.tasks.find(x=>x.id===a)?.priority||0));
  this.agent.save(this.agent.state);
  if(this.started&&!this.stopping)this.pump();
 }
 async pump(){
  if(!this.started||this.stopping)return;
  while(this.active<this.concurrency&&this.queue.length&&!this.stopping){
   const id=this.queue.shift(),t=this.agent.state.tasks.find(x=>x.id===id);
   if(!t||t.status!=="queued")continue;
   this.active++;this.running.add(id);t.attempt=Number(t.attempt||0)+1;t.startedAt=new Date().toISOString();t.lastHeartbeatAt=t.startedAt;t.updatedAt=t.startedAt;
   await this.agent.save(this.agent.state);emit("task.started",{id,attempt:t.attempt});
   this.agent.execute(t).catch(async e=>{
    t.error=e.message;t.updatedAt=new Date().toISOString();
    if(t.status!=="cancelled"&&t.attempt<=this.maxRetries){
     t.status="queued";this.queue.push(id);emit("task.retry",{id,attempt:t.attempt,error:e.message});
    }else{
     t.status="failed";this.agent.state.deadLetters??=[];this.agent.state.deadLetters.push({taskId:id,error:e.message,attempt:t.attempt,at:new Date().toISOString()});emit("task.failed",{id,error:e.message});
    }
    await this.agent.save(this.agent.state);
   }).finally(()=>{
    this.active--;this.running.delete(id);t.lastHeartbeatAt=new Date().toISOString();this.agent.save(this.agent.state);emit("task.finished",{id,status:t.status});this.pump();
   });
  }
 }
 async drain(timeoutMs=10000){
  const end=Date.now()+Math.max(0,Number(timeoutMs)||10000);
  this.stop();
  while(this.active>0&&Date.now()<end)await new Promise(r=>setTimeout(r,50));
  return this.snapshot();
 }
}