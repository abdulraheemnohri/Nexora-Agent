import fs from "node:fs";import path from "node:path";import crypto from "node:crypto";
const defaults=()=>({schemaVersion:1,tasks:[],memory:[],skills:[],schedules:[],audit:[],configVersions:[],deadLetters:[]});
export class Store{
 constructor(file){this.file=file;fs.mkdirSync(path.dirname(file),{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(defaults(),null,2));this.db=this.read()}
 read(){try{return{...defaults(),...JSON.parse(fs.readFileSync(this.file,"utf8"))}}catch(e){throw Error("Cannot read Nexora state: "+e.message)}}
 save(){const tmp=this.file+".tmp";fs.writeFileSync(tmp,JSON.stringify(this.db,null,2));fs.renameSync(tmp,this.file);return this.db}
 id(){return crypto.randomUUID()}
 add(type,v){if(!Array.isArray(this.db[type]))this.db[type]=[];const x={id:this.id(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...v};this.db[type].push(x);this.save();return x}
 update(type,id,patch){const x=(this.db[type]||[]).find(x=>x.id===id);if(!x)return null;Object.assign(x,patch,{updatedAt:new Date().toISOString()});this.save();return x}
 list(type){return this.db[type]??[]}
 remove(type,id){this.db[type]=(this.db[type]??[]).filter(x=>x.id!==id);this.save()}
}
const defaultFile=()=>path.resolve(process.env.NEXORA_DATA||"data","state.json");
let singleton;
export async function loadState(file=defaultFile()){if(!singleton||singleton.file!==file)singleton=new Store(file);return singleton.db}
export async function saveState(state){if(!singleton){singleton=new Store(defaultFile())}singleton.db=state;singleton.save();return state}
export async function backupState(destination){const s=new Store(defaultFile());fs.copyFileSync(s.file,destination);return destination}
