import fs from "node:fs";
import path from "node:path";
import {runShell} from "./platforms.js";
import {commandExists} from "./platform/termux-runtime.js";

export const SMART_MINI={
 id:"smart-mini",
 name:"Nexora Smart Mini",
 provider:"litert",
 repo:process.env.NEXORA_LITERT_MODEL_REPO||"litert-community/gemma-4-E2B-it-litert-lm",
 file:process.env.NEXORA_LITERT_MODEL_FILE||"gemma-4-E2B-it.litertlm"
};

const stateFile=()=>path.resolve(process.env.NEXORA_DATA||"./data","litert-models.json");
function read(){const f=stateFile();if(!fs.existsSync(f))return {active:"smart-mini",models:{}};try{return JSON.parse(fs.readFileSync(f,"utf8"))}catch{return {active:"smart-mini",models:{}}}}
function write(s){const f=stateFile();fs.mkdirSync(path.dirname(f),{recursive:true});const tmp=f+".tmp";fs.writeFileSync(tmp,JSON.stringify(s,null,2)+"\n");fs.renameSync(tmp,f);return s}
function spec(id){if(id==="smart-mini")return SMART_MINI;throw Error("Unknown LiteRT model: "+id)}
export async function modelStatus(id="smart-mini"){
 const m=spec(id), installed=await commandExists(process.env.NEXORA_LITERT_BIN||"litert-lm"), s=read();
 return {id:m.id,name:m.name,provider:m.provider,repo:m.repo,file:m.file,cliInstalled:installed,active:s.active===id,installedModel:Boolean(s.models[id]?.tested),lastTest:s.models[id]?.lastTest||null}
}
export async function listModels(){return {active:read().active,models:await Promise.all(["smart-mini"].map(modelStatus))}}
export async function testModel(id="smart-mini"){
 const m=spec(id);if(!(await commandExists(process.env.NEXORA_LITERT_BIN||"litert-lm")))throw Error("LiteRT-LM CLI is not installed");
 const bin=process.env.NEXORA_LITERT_BIN||"litert-lm";
 const line=bin+" run --from-huggingface-repo="+m.repo+" "+m.file+" --prompt "+JSON.stringify("Reply with exactly: NEXORA_LITERT_OK");
 const r=await runShell(line,{timeout:300000});
 const ok=r.code===0 && /NEXORA_LITERT_OK/.test(r.stdout||"");
 const s=read();s.models[id]={tested:ok,lastTest:new Date().toISOString()};write(s);
 return {id,ok,stdout:(r.stdout||"").slice(-4000),stderr:(r.stderr||"").slice(-2000),code:r.code}
}
export async function installModel(id="smart-mini"){return testModel(id)}
export function useModel(id="smart-mini"){spec(id);const s=read();s.active=id;write(s);return {active:id}}
