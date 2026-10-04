// Hermes-inspired capability registry for Nexora. Original implementation; no Hermes source is copied.
export const HERMES_TOOLSETS={
  web:["web_search","web_extract","x_search"],
  search:["web_search","web_extract","x_search"],
  terminal:["terminal","process_manage"],
  file:["read_file","write_file","patch","list_files"],
  browser:["browser_navigate","browser_snapshot","browser_click","browser_type","browser_press","browser_scroll","browser_back","browser_forward","browser_wait","browser_find","browser_download","browser_upload","browser_tabs","browser_close"],
  vision:["vision_analyze","computer_use","screenshot"],
  image_gen:["image_generate"],
  tts:["text_to_speech"],
  skills:["skills_list","skill_view","skill_manage"],
  todo:["todo_list","todo_update"],
  memory:["memory_search","memory_write","memory_delete","session_search"],
  cronjob:["cronjob_manage"],
  code_execution:["execute_code"],
  delegation:["delegate_task"],
  clarify:["clarify"],
  messaging:["message_send","message_broadcast"],
  homeassistant:["ha_get_states","ha_get_state","ha_call_service","ha_history"],
  discord:["discord_send","discord_react"],
  spotify:["spotify_search","spotify_play","spotify_pause","spotify_next","spotify_previous","spotify_queue","spotify_now_playing"],
  video:["video_generate","video_analyze","video_edit","video_extend"],
  mcp:["mcp_list","mcp_call"],
  project:["project_open","project_status"],
  debugging:["debug_trace","debug_health"],
  safe:["approval_request","policy_check","audit_log"]
};

export const HERMES_FEATURES={
  persistent_memory:true, session_search:true, progressive_skills:true, skill_hub:true,
  skill_write_approval:true, subagent_delegation:true, sandboxed_code_execution:true,
  event_hooks:true, batch_processing:true, provider_routing:true, context_files:true,
  browser_automation:true, browser_cdp:true, computer_use:true, web_search:true,
  web_extract:true, x_search:true, vision:true, image_generation:true, text_to_speech:true,
  video_tools:true, terminal_process_manager:true, todo:true, clarify:true, cron:true,
  mcp:true, openai_compatible_api:true, messaging_gateway:true, profiles:true,
  personality_soul:true, themes:true, plugins:true, audit:true, rollback:true,
  offline_local_provider:true, api_auth:true, rate_limits:true
};

export function listToolsets(){return Object.entries(HERMES_TOOLSETS).map(([name,tools])=>({name,tools,count:tools.length}))}
export function listTools(){return [...new Set(Object.values(HERMES_TOOLSETS).flat())].map(name=>({name,toolset:Object.entries(HERMES_TOOLSETS).filter(([,v])=>v.includes(name)).map(([k])=>k)}))}
export function toolsetsFor(names=[]){const wanted=new Set(names);return Object.entries(HERMES_TOOLSETS).filter(([k])=>wanted.has(k)).flatMap(([,v])=>v)}
