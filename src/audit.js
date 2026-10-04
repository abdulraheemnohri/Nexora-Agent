import crypto from "node:crypto";
export function audit(state,event){state.audit??=[];state.audit.push({id:crypto.randomUUID(),at:new Date().toISOString(),...event});if(state.audit.length>5000)state.audit.splice(0,state.audit.length-5000);return state.audit.at(-1)}
