#!/usr/bin/env node
import "dotenv/config";
import {loadState,saveState} from "./store.js";
import {Agent} from "./agent.js";
import {providers} from "./providers.js";
import {detectPlatform,runtimeSpec} from "./platforms.js";
import {doctor} from "./doctor.js";
import {TaskQueue} from "./task-queue.js";
import {Scheduler} from "./scheduler.js";
import {runShell} from "./platforms.js";
import {listModels,modelStatus,installModel,testModel,useModel} from "./litert-models.js";
import {providerStatus,listProviders,addProvider,updateProvider,removeProvider,useProvider} from "./provider-registry.js";
import {listMcpServers,addMcpServer,removeMcpServer} from "./mcp-registry.js";
import {listSources,addSource,inspect,hermesOfficialCatalog,importSkill} from "./skill-library.js";
import {Skills} from "./skills.js";

export async function main(argv=process.argv.slice(2)){
  const [cmd,...args]=argv;
  const state=await loadState();
  const config={workspace:process.env.NEXORA_WORKSPACE,maxAgentSteps:Number(process.env.NEXORA_MAX_AGENT_STEPS||20),security:{approvalMode:process.env.NEXORA_APPROVAL_MODE||"ask"}};
  const agent=new Agent(state,saveState,config);
  const queue=new TaskQueue(agent,{concurrency:Number(process.env.NEXORA_MAX_CONCURRENT_TASKS||2),maxRetries:Number(process.env.NEXORA_MAX_RETRIES||3)});
  agent.setQueue(queue); queue.restore();
  const scheduler=new Scheduler(state,saveState,queue); scheduler.restore();
  const help="Nexora: status|doctor|providers|provider add|update|remove|use|mcp list|add|remove|skills library|skills inspect|skills import|platform|chat <msg>|task <msg>|tasks|approve <id>|cancel <id>|retry <id>|memory|schedules|schedule <delayMs> <msg>|logs";
  if(!cmd){console.log(help);return}
  if(cmd==="status")console.log(JSON.stringify({version:"1.6.0",platform:detectPlatform(),tasks:state.tasks.length,queue:queue.snapshot(),memory:state.memory.length,skills:state.skills.length},null,2));
  else if(cmd==="doctor")console.log(JSON.stringify(await doctor(process.cwd()),null,2));
  else if(cmd==="providers")console.log(JSON.stringify(await providerStatus(),null,2));
  else if(cmd==="provider"){const sub=args.shift()||"list";if(sub==="list")console.log(JSON.stringify(listProviders(),null,2));else if(sub==="add"){const [id,type,baseUrl,model,...rest]=args;console.log(JSON.stringify(addProvider({id,type,baseUrl,model,command:rest.join(" ")}),null,2))}else if(sub==="update"){const id=args.shift();console.log(JSON.stringify(updateProvider(id,JSON.parse(args.join(" ")||"{}")),null,2))}else if(sub==="remove")console.log(JSON.stringify({removed:removeProvider(args[0])},null,2));else if(sub==="use")console.log(JSON.stringify(useProvider(args[0]),null,2));else console.log("provider: list|add <id> <type> <baseUrl> <model>|update <id> <json>|remove <id>|use <id>")}
  else if(cmd==="mcp"){const sub=args.shift()||"list";if(sub==="list")console.log(JSON.stringify(listMcpServers(),null,2));else if(sub==="add"){const [name,command,...rest]=args;console.log(JSON.stringify(addMcpServer({name,command,args:rest}),null,2))}else if(sub==="remove")console.log(JSON.stringify({removed:removeMcpServer(args[0])},null,2));else console.log("mcp: list|add <name> <command> [args...]|remove <name>")}
  else if(cmd==="skills"){const sub=args.shift()||"list";const sk=new Skills(state,saveState);if(sub==="list")console.log(JSON.stringify(sk.list(),null,2));else if(sub==="library")console.log(JSON.stringify(await hermesOfficialCatalog(),null,2));else if(sub==="sources")console.log(JSON.stringify(listSources(),null,2));else if(sub==="source-add")console.log(JSON.stringify(addSource(args[0],args[1]),null,2));else if(sub==="inspect")console.log(JSON.stringify(await inspect(args[0]),null,2));else if(sub==="import")console.log(JSON.stringify(await importSkill(sk,args[0],{trust:"community"}),null,2));else console.log("skills: list|library|sources|source-add <name> <https-url>|inspect <url>|import <SKILL.md-url>")}

  else if(cmd==="litert"){const sub=args.shift()||"status";if(sub==="install"){const command=process.platform==="win32"?"powershell -ExecutionPolicy Bypass -File scripts/install-litert-lm.ps1":"bash scripts/install-litert-lm.sh";console.log(JSON.stringify(await runShell(command,{timeout:600000}),null,2))}else if(sub==="status")console.log(JSON.stringify(await providers.status(),null,2));else if(sub==="test"){const cmdLine=`litert-lm run --from-huggingface-repo=${process.env.NEXORA_LITERT_MODEL_REPO||"litert-community/gemma-4-E2B-it-litert-lm"} ${process.env.NEXORA_LITERT_MODEL_FILE||"gemma-4-E2B-it.litertlm"} --prompt "Reply with exactly: NEXORA_LITERT_OK"`;console.log(JSON.stringify(await runShell(cmdLine,{timeout:300000}),null,2))}else console.log("litert: install|status|test")}
  else if(cmd==="model"){const sub=args.shift()||"list";if(sub==="list")console.log(JSON.stringify(await listModels(),null,2));else if(sub==="status")console.log(JSON.stringify(await modelStatus(args[0]||"smart-mini"),null,2));else if(sub==="install")console.log(JSON.stringify(await installModel(args[0]||"smart-mini"),null,2));else if(sub==="test")console.log(JSON.stringify(await testModel(args[0]||"smart-mini"),null,2));else if(sub==="use")console.log(JSON.stringify(useModel(args[0]||"smart-mini"),null,2));else console.log("model: list|status|install <id>|test <id>|use <id>")}
  else if(cmd==="platform")console.log(JSON.stringify(await runtimeSpec(),null,2));
  else if(cmd==="logs")console.log(JSON.stringify(state.audit,null,2));
  else if(cmd==="tasks")console.log(JSON.stringify(state.tasks,null,2));
  else if(cmd==="memory")console.log(JSON.stringify(state.memory,null,2));
  else if(cmd==="schedules")console.log(JSON.stringify(state.schedules,null,2));
  else if(cmd==="schedule"){const d=Number(args.shift());console.log(JSON.stringify(await scheduler.add(args.join(" "),d),null,2))}
  else if(cmd==="chat"){const r=await agent.run(args.join(" "));console.log(r.result??r.error??JSON.stringify(r,null,2))}
  else if(cmd==="task"){const t=agent.create(args.join(" "));queue.enqueue(t.id);console.log(JSON.stringify(t,null,2))}
  else if(cmd==="approve")console.log(JSON.stringify(await agent.approve(args[0]),null,2));
  else if(cmd==="cancel")console.log(JSON.stringify(agent.cancel(args[0]),null,2));
  else if(cmd==="retry")console.log(JSON.stringify(agent.retry(args[0]),null,2));
  else console.log(help);
}

if(import.meta.url===`file://${process.argv[1]}`) main().catch(e=>{console.error("Nexora error:",e.message);process.exitCode=1});
