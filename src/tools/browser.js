const endpoint=()=>String(process.env.NEXORA_BROWSER_CDP_URL||"http://127.0.0.1:9222");
async function cdpJson(pathname){const r=await fetch(endpoint()+pathname);if(!r.ok)throw Error("Browser CDP HTTP "+r.status);return r.json()}
export async function browserStatus(){return {endpoint:endpoint(),version:await cdpJson("/json/version")}}
export async function browserPages(){return cdpJson("/json/list")}
