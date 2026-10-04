import fs from "node:fs";
import path from "node:path";
const env=(k,d)=>process.env[k]??d;
export function loadConfig(){
 const root=process.cwd(),workspace=path.resolve(root,env("NEXORA_WORKSPACE","./workspace")),data=path.resolve(root,env("NEXORA_DATA","./data"));
 fs.mkdirSync(workspace,{recursive:true});fs.mkdirSync(data,{recursive:true});
 return{
  root,host:env("NEXORA_HOST","127.0.0.1"),port:Number(env("NEXORA_PORT",8787)),workspace,data,
  approvalMode:env("NEXORA_APPROVAL_MODE","ask"),terminalMode:env("NEXORA_TERMINAL_MODE","ask"),
  security:{approvalMode:env("NEXORA_APPROVAL_MODE","ask")},
  providerMode:env("NEXORA_PROVIDER_MODE","manual"),provider:env("NEXORA_PROVIDER","litert"),
  maxAgentSteps:Number(env("NEXORA_MAX_AGENT_STEPS",20)),maxConcurrentTasks:Number(env("NEXORA_MAX_CONCURRENT_TASKS",2)),
  anthropicKey:env("ANTHROPIC_API_KEY",""),anthropicModel:env("ANTHROPIC_MODEL",""),
  litertBin:env("NEXORA_LITERT_BIN","litert-lm"),
  litertCommand:env("NEXORA_LITERT_COMMAND",'litert-lm run --from-huggingface-repo=litert-community/gemma-4-E2B-it-litert-lm gemma-4-E2B-it.litertlm --prompt {prompt}'),
  litertModelRepo:env("NEXORA_LITERT_MODEL_REPO","litert-community/gemma-4-E2B-it-litert-lm"),
  litertModelFile:env("NEXORA_LITERT_MODEL_FILE","gemma-4-E2B-it.litertlm"),
  litertBackend:env("NEXORA_LITERT_BACKEND","auto"),
  smartMiniEnabled:env("NEXORA_SMART_MINI_ENABLED","true")==="true",
  smartMiniName:env("NEXORA_SMART_MINI_NAME","Nexora Smart Mini"),
  activeModel:env("NEXORA_ACTIVE_MODEL","smart-mini"),
  compatibleUrl:env("OPENAI_COMPATIBLE_URL",""),compatibleKey:env("OPENAI_COMPATIBLE_API_KEY",""),compatibleModel:env("OPENAI_COMPATIBLE_MODEL","")
 };
}