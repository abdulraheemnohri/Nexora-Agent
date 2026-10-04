import fs from "node:fs";
import path from "node:path";
import {runShell} from "./platforms.js";
import {commandExists} from "./platform/termux-runtime.js";

export const MODEL_CATALOG=[
 {id:"smart-mini",name:"Nexora Smart Mini",provider:"litert",repo:"litert-community/gemma-4-E2B-it-litert-lm",file:"gemma-4-E2B-it.litertlm",role:"general",recommended:true},
 {id:"gemma-3n-e2b",name:"Gemma 3n E2B",provider:"litert",repo:"google/gemma-3n-E2B-it-litert-lm",file:"gemma-3n-E2B-it.litertlm",role:"general",recommended:false}
];
const stateFile=()=>path.resolve(process.env.NEXORA_DATA||"./data","litert-models.json");
function read(){const f=stateFile();if(!fs.existsSync(f))return{version:1,active:"smart-mini",models:{}};try{return JSON.parse(fs.readFileSync(f,"utf8"))}catch{return{version:1,active:"smart-mini",models:{}}}}
function write(s){const f=stateFile();fs.mkdirSync(path.dirname(f),{recursive:true});const tmp=f+".tmp";fs.writeFileSync(tmp,JSON.stringify(s,null,2)+"\n");fs.renameSync(tmp,f);return s}
function spec(id){const m=MODEL_CATALOG.find(x=>x.id===id);if(!m)throw Error("Unknown LiteRT model: "+id);return m}
async function cli(){const bin=process.env.NEXORA_LITERT_BIN||"litert-lm";return{bin,installed:await commandExists(bin)}}
export async function modelStatus(id){
 const m=spec(id),c=await cli(),s=read(),r=s.models[id]||{};
 return{id:m.id,name:m.name,provider:m.provider,repo:m.repo,file:m.file,role:m.role,recommended:m.recommended,cliInstalled:c.installed,active:s.active===id,installedModel:Boolean(r.tested),lastTest:r.lastTest||null,lastOk:r.tested===true}
}
export async function listModels(){return{active:read().active,models:await Promise.all(MODEL_CATALOG.map(m=>modelStatus(m.id)))}}
export async function testModel(id="smart-mini"){
 const m=spec(id),c=await cli();if(!c.installed)throw Error("LiteRT-LM CLI is not installed");
 const line=c.bin+" run --from-huggingface-repo="+m.repo+" "+m.file+" --prompt "+JSON.stringify("Reply with exactly: NEXORA_LITERT_OK");
 const started=Date.now(),r=await runShell(line,{timeout:300000}),ok=r.code===0&&/NEXORA_LITERT_OK/.test(r.stdout||"");
 const s=read();s.models[id]={tested:ok,lastTest:new Date().toISOString(),durationMs:Date.now()-started};write(s);
 return{id,ok,durationMs:Date.now()-started,stdout:(r.stdout||"").slice(-4000),stderr:(r.stderr||"").slice(-2000),code:r.code}
}
export async function installModel(id="smart-mini"){return testModel(id)}
export function useModel(id="smart-mini"){spec(id);const s=read();s.active=id;write(s);return{active:id}}
