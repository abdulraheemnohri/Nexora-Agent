import {spawn} from "node:child_process";
function rpc(child,method,params={},id=1,timeout=15000){
 return new Promise((resolve,reject)=>{
  let buf="";
  const timer=setTimeout(()=>reject(Error("MCP request timed out")),timeout);
  const onData=d=>{
   buf+=d.toString();
   const lines=buf.split("\n");buf=lines.pop();
   for(const line of lines){if(!line.trim())continue;try{const m=JSON.parse(line);if(m.id===id){clearTimeout(timer);if(m.error)reject(Error(m.error.message||"MCP error"));else resolve(m.result)}}catch{}}
  };
  child.stdout.on("data",onData);child.stderr.resume();
  child.stdin.write(JSON.stringify({jsonrpc:"2.0",id,method,params})+"\n");
 });
}
export function startMcpServer(command,args=[]){
 const child=spawn(String(command),Array.isArray(args)?args:[],{stdio:["pipe","pipe","pipe"],shell:false});
 return {
  async initialize(){return rpc(child,"initialize",{protocolVersion:"2025-06-18",capabilities:{},clientInfo:{name:"nexora",version:"1.0"}})},
  async listTools(){return rpc(child,"tools/list",{},2)},
  async callTool(name,arguments={}){return rpc(child,"tools/call",{name,arguments},3)},
  close(){child.kill()}
 };
}
