#!/usr/bin/env node
import "dotenv/config";
import {loadState,saveState} from "./store.js";
import {Agent} from "./agent.js";
import {providers} from "./providers.js";
import {detectPlatform,runtimeSpec} from "./platforms.js";
import {doctor} from "./doctor.js";
const [cmd,...args]=process.argv.slice(2); const state=await loadState(),agent=new Agent(state,saveState);
if(!cmd){console.log("Nexora CLI: status | doctor | providers | platform | chat <message> | task <message> | approve <id> | cancel <id> | logs");process.exit(0)}
if(cmd==="status")console.log(JSON.stringify({version:"1.3.0",platform:detectPlatform(),tasks:state.tasks.length,memory:state.memory.length,skills:state.skills.length},null,2));
else if(cmd==="providers")console.log(JSON.stringify(await providers.status(),null,2));
else if(cmd==="platform")console.log(JSON.stringify(await runtimeSpec(),null,2));
else if(cmd==="doctor")console.log(JSON.stringify(await doctor(process.cwd()),null,2));
else if(cmd==="logs")console.log(JSON.stringify(state.audit,null,2));
else if(cmd==="chat"){const r=await agent.run(args.join(" "));console.log(r.result??r.error??JSON.stringify(r,null,2))}
else if(cmd==="task"){const t=agent.create(args.join(" "));agent.queue(t.id);console.log(JSON.stringify(t,null,2))}
else if(cmd==="approve")console.log(JSON.stringify(await agent.approve(args[0]),null,2));
else if(cmd==="cancel")console.log(JSON.stringify(agent.cancel(args[0]),null,2));
else console.log("Unknown command");
