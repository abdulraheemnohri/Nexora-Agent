import fs from "node:fs/promises";
const defaults={
  agent:{maxSteps:20,temperature:null,stream:true,contextWindow:null,autoRetry:2,parallelSubagents:3,timeoutMs:120000},
  security:{approvalMode:"high-risk",allowNetwork:true,allowShell:true,workspaceOnly:true,maxRequestBytes:2000000,rateLimitPerMinute:60},
  terminal:{backend:"local",shell:null,timeoutMs:60000,maxOutputBytes:200000,background:true,processManager:true},
  tools:{enabledToolsets:["web","terminal","file","browser","skills","memory","cronjob","delegation","code_execution","clarify","safe"],disabled:[],browserCdpUrl:"http://127.0.0.1:9222"},
  memory:{enabled:true,maxItems:10000,sessionSearch:true,writeApproval:true,retentionDays:0},
  skills:{enabled:true,directory:"~/.nexora/skills",progressiveDisclosure:true,writeApproval:true,externalDirectories:[],autoSuggest:true},
  scheduler:{enabled:true,maxJobs:100,timezone:"local"},
  delegation:{enabled:true,maxConcurrent:3,maxDepth:2,isolatedContext:true},
  channels:{telegram:false,whatsapp:false,discord:false,slack:false,signal:false,email:false,microsoftTeams:false},
  api:{host:"127.0.0.1",port:8787,tokenRequired:true,openAICompatible:true,sse:true,websocket:false},
  ui:{theme:"dark",skin:"nexora",showToolActivity:true,showReasoning:false,compact:false},
  personality:{soulFile:"SOUL.md",preset:"default"},
  plugins:{enabled:true,directory:"~/.nexora/plugins"},
  hooks:{enabled:true,events:["task.started","tool.before","tool.after","task.completed","task.failed"]},
  batch:{enabled:true,maxParallel:4},
  telemetry:{enabled:false,metrics:true,retainDays:30}
};
export function defaultConfig(){return structuredClone(defaults)}
export async function loadConfig(){
  const file=process.env.NEXORA_CONFIG||"config.json";
  try{return {...defaults,...JSON.parse(await fs.readFile(file,"utf8"))}}catch{return defaultConfig()}
}
export function mergeConfig(base,patch){return {...base,...patch}}
export const CONFIG_SCHEMA=defaults;
