import {FileSystemTool} from "./filesystem.js";
import {terminal} from "./terminal.js";
import {git} from "./git.js";
import {systemInfo} from "./system.js";
import {httpRequest} from "./http.js";
import {listProcesses} from "./process.js";
import {commandRisk,decision} from "../security/policy.js";

export function createToolRegistry(workspace,security={}) {
  const fs=new FileSystemTool(workspace);
  const mode=security.approvalMode==="high-risk"?"ask":(security.approvalMode||"ask");
  const tools=new Map([
    ["terminal",{name:"terminal",risk:a=>commandRisk(a.command)}],
    ["filesystem",{name:"filesystem",risk:a=>a.action==="write"?"high":"low"}],
    ["git",{name:"git",risk:a=>commandRisk(a.command)}],
    ["system",{name:"system",risk:()=> "low"}],
    ["http",{name:"http",risk:()=> "medium"}],
    ["process",{name:"process",risk:()=> "medium"}]
  ]);
  return {
    has:name=>tools.has(name),
    get:name=>tools.get(name),
    list:()=>[...tools.values()].map(t=>t.name),
    authorize:(name,args={})=>{const tool=tools.get(name);if(!tool)throw Error("Unknown tool: "+name);const r=tool.risk(args);return {risk:r,decision:decision({risk:r},mode)}},
    execute:async(name,args={},cwd=workspace,context={})=>{const tool=tools.get(name);if(!tool)throw Error("Unknown tool: "+name);const r=tool.risk(args);const d=decision({risk:r},mode);if(d!=="allow"&&!context.approved)throw Error("Tool requires approval: "+name+" ("+r+")");if(name==="terminal")return terminal(args.command,cwd,args.timeout);if(name==="filesystem")return args.action==="read"?fs.read(args.path):args.action==="write"?fs.write(args.path,args.content):args.action==="list"?fs.list(args.path):args.action==="stat"?fs.stat(args.path):Promise.reject(Error("Unsupported filesystem action"));if(name==="git")return git(args.command,cwd,args.mode||"ask");if(name==="system")return systemInfo();if(name==="http")return httpRequest(args);if(name==="process")return listProcesses();throw Error("Unsupported tool: "+name)}
  };
}