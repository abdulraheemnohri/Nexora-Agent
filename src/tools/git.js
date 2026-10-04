import {terminal} from "./terminal.js";
export async function git(command,cwd,mode="ask"){
 if(!/^git(?:\s|$)/i.test(String(command||"")))throw Error("Git tool accepts git commands only");
 return terminal(command,cwd,120000);
}