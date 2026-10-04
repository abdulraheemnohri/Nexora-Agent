import {FileSystemTool} from "./filesystem.js";
import {terminal} from "./terminal.js";
import {git} from "./git.js";
import {systemInfo} from "./system.js";
import {commandRisk,decision} from "../security/policy.js";

export function createToolRegistry(workspace,security={}) {
  const fs=new FileSystemTool(workspace);
  const mode=security.approvalMode==="high-risk"?"ask":(security.approvalMode||"ask");
  const tools=new Map([
    ["terminal",{name:"terminal",risk:a=>commandRisk(a.command),execute:(a,c)=>terminal(a.command,c,a.timeout)}],
    ["filesystem",{name:"filesystem",risk:a=>a.action==="write"?"high":"low",execute:a=>a.action==="read"?fs.read(a.path):a.action==="write"?fs.write(a.path,a.content):a.action==="list"?fs.list(a.path):a.action==="stat"?fs.stat(a.path):Promise.reject(Error("Unsupported filesystem action"))}],
    ["git",{name:"git",risk:a=>commandRisk(a.command),execute:(a,c)=>git(a.command,c,a.mode||"ask")}],
    ["system",{name:"system",risk:()=> "low",execute:async()=>systemInfo()}]
  ]);
  return {
    has:name=>tools.has(name),
    get:name=>tools.get(name),
    list:()=>[...tools.values()].map(t=>t.name),
    authorize:(name,args={})=>{const tool=tools.get(name);if(!tool)throw Error("Unknown tool: "+name);const risk=tool.risk(args);return {risk,decision:decision({risk,mode})}},
    execute:async(name,args={},cwd=workspace)=>{const tool=tools.get(name);if(!tool)throw Error("Unknown tool: "+name);const risk=tool.risk(args);const d=decision({risk,mode});if(d!=="allow")throw Error("Tool requires approval: "+name+" ("+risk+")");return tool.execute(args,cwd)}
  };
}