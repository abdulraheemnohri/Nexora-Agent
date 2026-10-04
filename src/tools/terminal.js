import {runShell} from "../platforms.js";
export async function terminal(command,cwd,timeout=60000){
 if(typeof command!=="string"||!command.trim())throw Error("command required");
 const limit=Math.min(Math.max(Number(timeout)||60000,1000),120000);
 return runShell(command,{cwd,timeout:limit});
}