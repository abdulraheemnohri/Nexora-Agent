export const TOOL_SCHEMAS={
 terminal:{description:"Execute a command inside the configured workspace.",input:{type:"object",required:["command"],properties:{command:{type:"string"},cwd:{type:"string"},timeout:{type:"number"}}}},
 filesystem:{description:"Read, write, list, or stat workspace files.",input:{type:"object",required:["action","path"],properties:{action:{type:"string",enum:["read","write","list","stat"]},path:{type:"string"},content:{type:"string"}}}},
 git:{description:"Run an approved git operation in the workspace.",input:{type:"object",required:["command"],properties:{command:{type:"string"},mode:{type:"string"}}}},
 system:{description:"Return host/runtime information.",input:{type:"object",properties:{}}},
 http:{description:"Fetch an external HTTP(S) resource subject to SSRF and size controls.",input:{type:"object",required:["url"],properties:{url:{type:"string"},method:{type:"string"},headers:{type:"object"},body:{type:"string"},timeout:{type:"number"},maxBytes:{type:"number"}}}},
 process:{description:"List running processes available to the current user.",input:{type:"object",properties:{}}}
};
export function toolSchema(name){return TOOL_SCHEMAS[name]||null}
export function allToolSchemas(){return Object.entries(TOOL_SCHEMAS).map(([name,schema])=>({name,...schema}))}
