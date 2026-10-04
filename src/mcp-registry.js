import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const file=()=>path.resolve(process.env.NEXORA_DATA||"data","mcp-servers.json");
function read(){const f=file();fs.mkdirSync(path.dirname(f),{recursive:true});if(!fs.existsSync(f))return{version:1,servers:[]};try{return JSON.parse(fs.readFileSync(f,"utf8"))}catch{return{version:1,servers:[]}}}
function write(s){const f=file(),tmp=f+".tmp";fs.writeFileSync(tmp,JSON.stringify(s,null,2)+"\n");fs.renameSync(tmp,f)}
const validName=n=>/^[a-zA-Z0-9_-]{1,48}$/.test(String(n||""));
export function listMcpServers(){return read().servers.map(s=>({...s,env:undefined}))}
export function addMcpServer(input={}){const s=read(),name=String(input.name||"");if(!validName(name))throw Error("Invalid MCP server name");if(s.servers.some(x=>x.name===name))throw Error("MCP server already exists");if(!input.command)throw Error("MCP command is required");const x={id:crypto.randomUUID(),name,command:String(input.command),args:Array.isArray(input.args)?input.args.map(String):[],enabled:input.enabled!==false,timeout:Number(input.timeout)||15000,createdAt:new Date().toISOString()};s.servers.push(x);write(s);return x}
export function removeMcpServer(name){const s=read(),n=s.servers.length;s.servers=s.servers.filter(x=>x.name!==name);write(s);return n!==s.servers.length}
export function getMcpServer(name){return read().servers.find(x=>x.name===name)||null}
export function mcpConfig(name){const x=getMcpServer(name);if(!x)throw Error("MCP server not found");return{name:x.name,command:x.command,args:x.args,timeout:x.timeout}}
