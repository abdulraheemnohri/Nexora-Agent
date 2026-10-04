import fs from "node:fs/promises";
export function json(res,status,data){res.writeHead(status,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify(data));}
export async function readBody(req){let s="";for await(const c of req)s+=c;if(s.length>2000000)throw Error("Request too large");return s?JSON.parse(s):{}}
export function authorized(req){const t=process.env.NEXORA_API_TOKEN;return Boolean(t&&req.headers.authorization==="Bearer "+t)}
export async function sendFile(res,p,type){res.writeHead(200,{"content-type":type});res.end(await fs.readFile(p))}
