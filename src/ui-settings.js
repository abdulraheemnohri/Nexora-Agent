import fs from "node:fs";
import path from "node:path";

const defaults = () => ({
  general: { agentName:"Nexora", language:"en", timezone:"Asia/Karachi", workspace:"./workspace", theme:"dark", compactMode:false, confirmNavigation:false },
  ai: { preferredProvider:"manual", preferredModel:"", fallbackPolicy:"never", maxSteps:20, temperature:0.2, streamResponses:true, contextLimit:32768 },
  terminal: { approvalMode:"ask", timeoutSeconds:120, workingDirectory:"./workspace", allowShell:false, keepCommandHistory:true, maxOutputKb:256 },
  tools: { enabledToolsets:["filesystem","git","system","http"], maxParallelTools:2, requireWriteApproval:true, allowNetwork:true },
  permissions: { approvalMode:"ask", allowDestructive:false, allowOutsideWorkspace:false, allowPrivilegeEscalation:false, requireApprovalForExternalCalls:true },
  memory: { enabled:true, retentionDays:365, maxItems:10000, autoSave:true, summarizeLongSessions:true },
  skills: { requireApproval:true, allowExternalImport:true, autoUpdate:false, scanBeforeImport:true },
  scheduler: { enabled:true, maxConcurrentTasks:2, maxRetries:3, pollIntervalMs:1000, keepHistoryDays:30 },
  channels: { telegramEnabled:false, whatsappEnabled:false, webhookEnabled:false, showSetupHints:true },
  security: { bindHost:"127.0.0.1", rateLimitPerMinute:60, redactSecrets:true, auditActions:true, blockPrivateNetworkRequests:true, sessionTimeoutMinutes:60 },
  network: { requestTimeoutSeconds:30, maxResponseKb:1024, allowRedirects:false, proxyUrl:"" },
  mcp: { enabled:true, defaultTimeoutMs:15000, autoConnectRegistered:true, requireTrustedCommands:true },
  logging: { level:"info", maxLogMb:20, redactLogs:true, includeToolOutput:false },
  backups: { enabled:true, retentionCount:10, directory:"./backups", beforeSkillChanges:true },
  system: { startWorker:false, autoRecoverTasks:true, healthCheckSeconds:30 },
  about: { showExperimental:false }
});
const secretLike = /(?:api.?key|token|secret|password|credential)/i;
const filename = () => path.resolve(process.env.NEXORA_DATA || "data", "ui-settings.json");
function readFile() {
  const file=filename(); fs.mkdirSync(path.dirname(file),{recursive:true});
  if(!fs.existsSync(file)) return defaults();
  try { return { ...defaults(), ...JSON.parse(fs.readFileSync(file,"utf8")) }; }
  catch { return defaults(); }
}
function safe(value) {
  if(Array.isArray(value)) return value.map(safe);
  if(value && typeof value==="object") return Object.fromEntries(Object.entries(value).filter(([k])=>!secretLike.test(k)).map(([k,v])=>[k,safe(v)]));
  return value;
}
export function getUiSettings() { return safe(readFile()); }
export function updateUiSettings(input={}) {
  if(!input || typeof input!=="object" || Array.isArray(input)) throw Error("Settings payload must be an object");
  const current=readFile(), allowed=defaults();
  for(const [section, values] of Object.entries(input)) {
    if(!Object.hasOwn(allowed,section)) throw Error("Unknown settings section: "+section);
    if(!values || typeof values!=="object" || Array.isArray(values)) throw Error("Settings section must be an object: "+section);
    for(const [key,value] of Object.entries(values)) {
      if(!Object.hasOwn(allowed[section],key)) throw Error("Unknown setting: "+section+"."+key);
      if(secretLike.test(key)) throw Error("Secrets must be configured through environment variables, not UI settings.");
      const template=allowed[section][key];
      if(typeof value!==typeof template && value!==null) throw Error("Invalid type for setting: "+section+"."+key);
      if(typeof value==="number" && (!Number.isFinite(value)||value<0)) throw Error("Setting must be a non-negative number: "+key);
      if(typeof value==="string" && value.length>2000) throw Error("Setting is too long: "+key);
      current[section][key]=value;
    }
  }
  const file=filename(), tmp=file+".tmp";
  fs.writeFileSync(tmp,JSON.stringify(current,null,2)+"\n",{mode:0o600});
  fs.renameSync(tmp,file);
  return safe(current);
}
