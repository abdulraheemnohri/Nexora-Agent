import fs from "node:fs";
import path from "node:path";

const defaults = () => ({
  general: { agentName:"Nexora", language:"en", timezone:"Asia/Karachi", workspace:"./workspace", theme:"dark", compactMode:false, confirmNavigation:false },
  providers: { preferredProvider:"manual", fallbackPolicy:"never" },
  models: { preferredModel:"smart-mini", maxSteps:20, temperature:0.2, streamResponses:true, contextLimit:32768 },
  terminal: { timeoutSeconds:120, workingDirectory:"./workspace", allowShell:false, keepCommandHistory:true, maxOutputKb:256 },
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
  try {
    const base=defaults(), saved=JSON.parse(fs.readFileSync(file,"utf8"));
    if(!saved || typeof saved!=="object" || Array.isArray(saved)) return base;
    for(const [section, values] of Object.entries(saved)) {
      if(Object.hasOwn(base,section) && values && typeof values==="object" && !Array.isArray(values)) {
        base[section]={...base[section],...values};
      }
    }
    return base;
  } catch { return defaults(); }
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
      const choices={
        "permissions.approvalMode":["ask","safe","trusted"],
        "general.theme":["dark","light","system"],
        "providers.fallbackPolicy":["never","manual"],
        "logging.level":["debug","info","warn","error"]
      };
      const settingKey=section+"."+key;
      if(choices[settingKey]&&!choices[settingKey].includes(value))throw Error("Invalid value for setting: "+settingKey);
      if(typeof value==="number") {
        const bounds={
          "models.maxSteps":[1,200],"models.temperature":[0,2],"models.contextLimit":[256,1048576],
          "terminal.timeoutSeconds":[1,3600],"terminal.maxOutputKb":[1,65536],
          "tools.maxParallelTools":[1,32],"memory.retentionDays":[0,36500],"memory.maxItems":[1,1000000],
          "scheduler.maxConcurrentTasks":[1,64],"scheduler.maxRetries":[0,20],"scheduler.pollIntervalMs":[100,3600000],
          "scheduler.keepHistoryDays":[0,36500],"security.rateLimitPerMinute":[1,100000],
          "security.sessionTimeoutMinutes":[1,10080],"network.requestTimeoutSeconds":[1,3600],
          "network.maxResponseKb":[1,1048576],"mcp.defaultTimeoutMs":[100,300000],
          "logging.maxLogMb":[1,10240],"backups.retentionCount":[0,1000],
          "system.healthCheckSeconds":[1,3600]
        };
        const range=bounds[settingKey];
        if(!Number.isFinite(value)||value<0) throw Error("Setting must be a non-negative number: "+settingKey);
        if(range&&(value<range[0]||value>range[1])) throw Error("Setting is outside the allowed range: "+settingKey);
      }
      if(typeof value==="string" && value.length>2000) throw Error("Setting is too long: "+key);
      current[section][key]=value;
    }
  }
  const file=filename(), tmp=file+".tmp";
  fs.writeFileSync(tmp,JSON.stringify(current,null,2)+"\n",{mode:0o600});
  fs.renameSync(tmp,file);
  return safe(current);
}

export function resetUiSettingsSection(section) {
  const base=defaults();
  if(!Object.hasOwn(base,section)) throw Error("Unknown settings section: "+section);
  const current=readFile();
  current[section]=base[section];
  const file=filename(),tmp=file+".tmp";
  fs.writeFileSync(tmp,JSON.stringify(current,null,2)+"\n",{mode:0o600});
  fs.renameSync(tmp,file);
  return safe(current);
}
