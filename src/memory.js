import crypto from "node:crypto";
export class Memory{
 constructor(state,save){this.state=state;this.save=save}
 async add(content,meta={}){const m={id:crypto.randomUUID(),content:String(content),meta,createdAt:new Date().toISOString()};this.state.memory.push(m);if(this.state.memory.length>10000)this.state.memory.splice(0,this.state.memory.length-10000);await this.save(this.state);return m}
 search(q,limit=20){const terms=String(q).toLowerCase().split(/\s+/).filter(Boolean);return this.state.memory.map(m=>({...m,score:terms.reduce((n,t)=>n+(m.content.toLowerCase().includes(t)?1:0),0)})).filter(m=>m.score>0).sort((a,b)=>b.score-a.score).slice(0,limit)}
}