import fs from "node:fs/promises";
const file="data/state.json",defaults={memory:[],skills:[],tasks:[],schedules:[],audit:[]};
export async function loadState(){try{return {...structuredClone(defaults),...JSON.parse(await fs.readFile(file,"utf8"))}}catch{await fs.mkdir("data",{recursive:true});await fs.writeFile(file,JSON.stringify(defaults,null,2));return structuredClone(defaults)}}
export async function saveState(s){await fs.mkdir("data",{recursive:true});const t=file+".tmp";await fs.writeFile(t,JSON.stringify(s,null,2));await fs.rename(t,file)}
