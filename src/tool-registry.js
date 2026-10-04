import {HERMES_TOOLSETS,listTools,listToolsets} from "./hermes.js";
const risky=new Set(["terminal","process_manage","write_file","patch","browser_download","browser_upload","execute_code","skill_manage","mcp_call","message_send","message_broadcast","ha_call_service"]);
export const toolRegistry=new Map(listTools().map(t=>[t.name,{...t,risk:risky.has(t.name)?"high":"low",requiresApproval:risky.has(t.name)}]));
export function getTool(name){return toolRegistry.get(name)}
export function toolsStatus(){return [...toolRegistry.values()]}
export function toolsetsStatus(){return listToolsets().map(x=>({...x,enabled:true}))}
export {HERMES_TOOLSETS};
