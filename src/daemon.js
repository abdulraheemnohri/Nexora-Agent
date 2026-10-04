import "dotenv/config";
import {loadState,saveState} from "./store.js";
import {Agent} from "./agent.js";
import {Scheduler} from "./scheduler.js";
const state=await loadState(),agent=new Agent(state,saveState); new Scheduler(state,saveState,agent).restore();
console.log("Nexora background worker started."); setInterval(()=>{},2147483647);
