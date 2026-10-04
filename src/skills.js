import crypto from "node:crypto";
export class Skills{
 constructor(state,save){this.state=state;this.save=save}
 list(){return this.state.skills}
 async propose(name,description,instructions){const s={id:crypto.randomUUID(),name:String(name),description:String(description||""),instructions:String(instructions||""),version:1,status:"proposed",createdAt:new Date().toISOString()};this.state.skills.push(s);await this.save(this.state);return s}
 async approve(id){const s=this.state.skills.find(x=>x.id===id);if(!s)throw Error("Skill not found");if(s.status!=="proposed")throw Error("Skill is not awaiting approval");s.status="active";s.approvedAt=new Date().toISOString();await this.save(this.state);return s}
 async rollback(id){const s=this.state.skills.find(x=>x.id===id);if(!s)throw Error("Skill not found");s.status="rolled_back";s.rolledBackAt=new Date().toISOString();await this.save(this.state);return s}
}