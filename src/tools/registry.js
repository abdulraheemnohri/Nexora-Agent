import {FileSystemTool} from "./filesystem.js";
import {terminal} from "./terminal.js";
import {git} from "./git.js";
import {systemInfo} from "./system.js";
import {httpRequest} from "./http.js";
import {listProcesses} from "./process.js";
import {commandRisk,decision} from "../security/policy.js";
import {McpClient} from "../mcp.js";

export function createToolRegistry(workspace,security={}) {
  const mcpServers=new Map();
  const fs=new FileSystemTool(workspace);
  let mode=security.approvalMode==="high-risk"?"ask":(security.approvalMode||"ask");
  const tools=new Map([
    ["terminal",{name:"terminal",risk:a=>commandRisk(a.command)}],
    ["filesystem",{name:"filesystem",risk:a=>a.action==="write"?"high":"low"}],
    ["git",{name:"git",risk:a=>commandRisk(a.command)}],
    ["system",{name:"system",risk:()=> "low"}],
    ["http",{name:"http",risk:()=> "medium"}],
    ["process",{name:"process",risk:()=> "medium"}]
  ]);
  const mcpParts=name=>String(name||"").split(":");
  const mcpEntry=name=>{
    const p=mcpParts(name);
    if(p.length<3||p[0]!=="mcp")return null;
    const server=p[1],toolName=p.slice(2).join(":");
    const client=mcpServers.get(server);
    if(!client)return null;
    const advertised=client.tools.find(t=>t.name===toolName);
    return advertised?{server,toolName,client,advertised}:null;
  };
  return {
    setWorkspace(root){fs.root=root;return fs.root},
    setApprovalMode(value){mode=["ask","safe","trusted"].includes(value)?value:"ask";return mode},
    has:name=>tools.has(name)||Boolean(mcpEntry(name)),
    get:name=>tools.get(name)||mcpEntry(name)?.advertised||null,
    list:()=>[...tools.values()].map(t=>t.name),
    mcpList:()=>[...mcpServers.entries()].flatMap(([server,c])=>c.tools.map(t=>({name:`mcp:${server}:${t.name}`,server,...t}))),
    async addMcpServer(name,command,args=[],opts={}) {
      if(!/^[a-zA-Z0-9_-]{1,48}$/.test(name))throw Error("Invalid MCP server name");
      if(mcpServers.has(name))throw Error("MCP server already exists: "+name);
      const client=new McpClient(command,args,opts);
      await client.connect();
      mcpServers.set(name,client);
      return{name,tools:client.tools};
    },
    removeMcpServer(name){const c=mcpServers.get(name);if(!c)return false;c.close();mcpServers.delete(name);return true},
    authorize:(name,args={})=>{
      const m=mcpEntry(name);
      if(m){const r="medium";return{risk:r,decision:decision({risk:r},mode)}}
      const tool=tools.get(name);if(!tool)throw Error("Unknown tool: "+name);
      const r=tool.risk(args);return{risk:r,decision:decision({risk:r},mode)};
    },
    execute:async(name,args={},cwd=workspace,context={})=>{
      const m=mcpEntry(name);
      if(m){
        const r="medium",d=decision({risk:r},mode);
        if(d!=="allow"&&!context.approved)throw Error("MCP tool requires approval: "+name+" ("+r+")");
        return m.client.callTool(m.toolName,args);
      }
      const tool=tools.get(name);if(!tool)throw Error("Unknown tool: "+name);
      const r=tool.risk(args),d=decision({risk:r},mode);
      if(d!=="allow"&&!context.approved)throw Error("Tool requires approval: "+name+" ("+r+")");
      if(name==="terminal")return terminal(args.command,cwd,args.timeout);
      if(name==="filesystem")return args.action==="read"?fs.read(args.path):args.action==="write"?fs.write(args.path,args.content):args.action==="list"?fs.list(args.path):args.action==="stat"?fs.stat(args.path):Promise.reject(Error("Unsupported filesystem action"));
      if(name==="git")return git(args.command,cwd,args.mode||"ask");
      if(name==="system")return systemInfo();
      if(name==="http")return httpRequest(args);
      if(name==="process")return listProcesses();
      throw Error("Unsupported tool: "+name);
    }
  };
}