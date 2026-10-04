import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const roots={
 hermes:"https://raw.githubusercontent.com/NousResearch/hermes-agent/main",
 hermesOfficial:"https://raw.githubusercontent.com/NousResearch/hermes-agent/main/optional-skills",
 agentskills:"https://raw.githubusercontent.com/agentskills/agentskills/main"
};
const stateFile=()=>path.resolve(process.env.NEXORA_DATA||"data","skill-sources.json");
function read(){const f=stateFile();fs.mkdirSync(path.dirname(f),{recursive:true});if(!fs.existsSync(f))return{version:1,sources:[]};try{return JSON.parse(fs.readFileSync(f,"utf8"))}catch{return{version:1,sources:[]}}}
function write(s){const f=stateFile(),tmp=f+".tmp";fs.writeFileSync(tmp,JSON.stringify(s,null,2)+"\n");fs.renameSync(tmp,f)}
function safeName(s){return String(s||"").toLowerCase().replace(/[^a-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,80)}
function parseFrontmatter(md){const m=String(md).match(/^---\s*\n([\s\S]*?)\n---/);const meta={};if(!m)return meta;for(const line of m[1].split("\n")){const x=line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);if(x)meta[x[1]]=x[2].replace(/^["']|["']$/g,"")}return meta}
async function fetchText(url){const r=await fetch(url,{redirect:"manual"});if(r.status>=300&&r.status<400)throw Error("Redirect refused for skill source");if(!r.ok)throw Error("Skill source HTTP "+r.status);const text=await r.text();if(text.length>1024*1024)throw Error("Skill exceeds 1MB limit");return text}
export function listSources(){return read().sources}
export function addSource(name,url){const s=read(),n=safeName(name);if(!n||!/^https:\/\//i.test(url))throw Error("HTTPS source required");if(s.sources.some(x=>x.name===n))throw Error("Skill source already exists");s.sources.push({id:crypto.randomUUID(),name:n,url:String(url),createdAt:new Date().toISOString()});write(s);return s.sources.at(-1)}
export async function inspect(url){const text=await fetchText(url);const meta=parseFrontmatter(text);return{name:meta.name||path.basename(new URL(url).pathname,".md"),description:meta.description||"",version:meta.version||"unknown",size:text.length,source:url,content:text.slice(0,20000)}}
export async function importSkill(skills,url,opts={}){
 const info=await inspect(url);const name=safeName(opts.name||info.name);if(!name)throw Error("Invalid skill name");
 const scan=[/\b(ignore previous|override system|disable security|bypass approval)\b/i,/curl\s+[^\n]+\|\s*(sh|bash)/i,/wget\s+[^\n]+\|\s*(sh|bash)/i];
 const findings=scan.filter(r=>r.test(info.content)).map(r=>r.toString());
 const proposed=await skills.propose(name,info.description,info.content);
 proposed.source={type:"remote",url,trust:opts.trust||"community",securityFindings:findings};
 proposed.external=true;
 await skills.save(skills.state);
 return{skill:proposed,securityFindings:findings,requiresApproval:true};
}
export async function hermesOfficialCatalog(){
 return{sources:[
  {id:"hermes-official",name:"Hermes official optional skills",base:roots.hermesOfficial,installHint:"Provide the exact optional-skills/<category>/<skill>/SKILL.md URL or use inspect/import."},
  {id:"hermes-bundled",name:"Hermes bundled skills",base:roots.hermes,installHint:"Provide the exact bundled skill SKILL.md URL from the Hermes catalog."},
  {id:"skills-sh",name:"skills.sh ecosystem",base:"https://skills.sh",installHint:"Use a direct SKILL.md URL or repository raw URL."}
 ]};
}