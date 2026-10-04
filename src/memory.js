import crypto from "node:crypto";
export class Memory{
 constructor(state,save){this.state=state;this.save=save;this.state.memory??=[]}
 async add(content,meta={}){const m={id:crypto.randomUUID(),content:String(content),meta:{...meta},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),archived:false};this.state.memory.push(m);this.trim();await this.save(this.state);return m}
 get(id){return this.state.memory.find(m=>m.id===id)||null}
 list({includeArchived=false,limit=100}={}){return this.state.memory.filter(m=>includeArchived||!m.archived).slice(-Math.max(1,Number(limit)||100)).reverse()}
 search(q,limit=20){const terms=String(q).toLowerCase().split(/\s+/).filter(Boolean);return this.state.memory.map(m=>({...m,score:terms.reduce((n,t)=>n+(String(m.content).toLowerCase().includes(t)?1:0),0)})).filter(m=>m.score>0&&(!m.archived)).sort((a,b)=>b.score-a.score||new Date(b.createdAt)-new Date(a.createdAt)).slice(0,Math.max(1,Number(limit)||20))}
 async update(id,patch={}){const m=this.get(id);if(!m)throw Error("Memory not found");if(patch.content!==undefined)m.content=String(patch.content);if(patch.meta!==undefined)m.meta={...m.meta,...patch.meta};m.updatedAt=new Date().toISOString();await this.save(this.state);return m}
 async archive(id){const m=this.get(id);if(!m)throw Error("Memory not found");m.archived=true;m.archivedAt=new Date().toISOString();await this.save(this.state);return m}
 async remove(id){const i=this.state.memory.findIndex(m=>m.id===id);if(i<0)throw Error("Memory not found");const[m]=this.state.memory.splice(i,1);await this.save(this.state);return m}
 trim(){if(this.state.memory.length>10000)this.state.memory.splice(0,this.state.memory.length-10000)}
}