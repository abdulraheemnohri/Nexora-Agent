import fs from"node:fs";import path from"node:path";import{commandExists,termuxRuntime}from"./platform/termux-runtime.js";
export async function doctor(root=process.cwd()){
 const checks=[];const add=(name,ok,detail)=>checks.push({name,status:ok?"PASS":"FAIL",detail});
 add("Node.js",true,process.version);add("Workspace",fs.existsSync(path.join(root,"workspace")),root);add("Data",fs.existsSync(path.join(root,"data")),root);add("Git",await commandExists("git"),"git executable");
 const litert=await commandExists(process.env.NEXORA_LITERT_BIN||"litert-lm");add("LiteRT-LM CLI",litert,process.env.NEXORA_LITERT_BIN||"litert-lm");
 if(litert){try{const {runShell}=await import("./platforms.js");const r=await runShell((process.env.NEXORA_LITERT_BIN||"litert-lm")+" --help",{timeout:5000});add("LiteRT-LM help",r.code===0||!!(r.stdout||r.stderr),(r.stdout||r.stderr).slice(0,500))}catch(e){add("LiteRT-LM help",false,e.message)}}
 const t=await termuxRuntime();if(t.termux){add("Termux",true,t.version||"detected");for(const[k,v]of Object.entries(t.commands))add("Termux "+k,v,"executable");add("termux-wake-lock",true,t.wakeLock?"available":"optional")}
 return{ok:checks.every(x=>x.status!=="FAIL"),platform:t.termux?"termux":process.platform,smartMini:{name:"Nexora Smart Mini",repo:process.env.NEXORA_LITERT_MODEL_REPO||"litert-community/gemma-4-E2B-it-litert-lm",file:process.env.NEXORA_LITERT_MODEL_FILE||"gemma-4-E2B-it.litertlm"},checks}
}