(() => {
  const view=document.querySelector("#view");
  const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const api=async(url,opts={})=>{const r=await fetch(url,{...opts,headers:{"content-type":"application/json",authorization:"Bearer "+(localStorage.nexoraToken||""),...(opts.headers||{})}});const text=await r.text();let d={};try{d=text?JSON.parse(text):{}}catch{d={error:text}}if(!r.ok)throw Error(d.error||("HTTP "+r.status));return d};
  const toast=m=>{const t=document.querySelector("#toast");if(t){t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400)}};
  const card=(h,b)=>'<div class="card"><h2>'+h+'</h2>'+b+'</div>';
  const stat=(label,value,sub="")=>'<div class="stat"><strong>'+esc(value)+'</strong><span>'+esc(label)+(sub?' · '+esc(sub):'')+'</span></div>';
  const field=(label,id,placeholder,value="",type="text")=>'<label class="cap-field"><span>'+label+'</span><input id="'+id+'" type="'+type+'" placeholder="'+esc(placeholder)+'" value="'+esc(value)+'"></label>';
  const textarea=(label,id,placeholder,value="")=>'<label class="cap-field"><span>'+label+'</span><textarea id="'+id+'" placeholder="'+esc(placeholder)+'">'+esc(value)+'</textarea></label>';
  const button=(label,action,id="",kind="")=>'<button class="mini '+kind+'" data-ui-action="'+action+'" data-id="'+esc(id)+'">'+label+'</button>';
  const titles={dashboard:"Dashboard",chat:"Chat",sessions:"Conversations",tasks:"Tasks",memory:"Memory",models:"Models",schedules:"Schedules",tools:"Tools",channels:"Channels",audit:"Audit Log",settings:"Settings",system:"System",npm:"npm Packages",logs:"Logs"};
  let active="dashboard", settingsCache={};
  function heading(v,sub=""){return '<span class="eyebrow">NEXORA / '+v.toUpperCase()+'</span>'+(sub?'<p class="muted">'+esc(sub)+'</p>':'')}
  async function dashboard(){
    const [state,health,config,provider,tools]=await Promise.all([api("/api/state"),api("/api/health"),api("/api/config"),api("/api/providers"),api("/api/tools")]);
    const tasks=state.tasks||[], approvals=tasks.filter(t=>t.status==="awaiting_approval").length;
    const queue=state.queue||{};
    view.innerHTML=card("Operational overview",heading("Live control plane","A live view of the local Nexora runtime. Refresh to retrieve current server metrics.")+'<div class="grid">'+stat("Runtime",health.platform,health.node)+stat("Total tasks",tasks.length)+stat("Awaiting approval",approvals)+stat("Memory entries",(state.memory||[]).length)+stat("Skills",(state.skills||[]).length)+stat("Schedules",(state.schedules||[]).length)+stat("Providers",(provider.dynamicProviders||[]).length,provider.active||"No active dynamic provider")+stat("Tool definitions",Array.isArray(tools)?tools.length:Object.keys(tools||{}).length)+stat("Workspace",config.workspace||"configured")+'</div>')+
      card("Approval queue",approvals?tasks.filter(t=>t.status==="awaiting_approval").map(t=>'<div class="task-row"><div><b>'+esc(t.message||"Pending action")+'</b><small>'+esc(t.id)+'</small></div>'+button("Review","open-task",t.id,"approve")+'</div>').join(""):'<p class="muted">No actions are waiting for approval.</p>')+
      card("Recent activity",(state.audit||[]).slice(-8).reverse().map(a=>'<div class="task-row"><div><b>'+esc(a.event||a.action||"event")+'</b><small>'+esc(a.createdAt||a.timestamp||"")+' · '+esc(a.taskId||a.providerId||a.server||"")+'</small></div></div>').join("")||'<p class="muted">No audit events yet.</p>');
  }
  async function chat(){
    const [providers,models]=await Promise.all([api("/api/providers"),api("/api/models")]);
    let sessions=await api("/api/sessions");let activeId=localStorage.nexoraSessionId||"";
    if(!sessions.some(s=>s.id===activeId)){const created=await api("/api/sessions",{method:"POST",body:JSON.stringify({title:"New conversation"})});activeId=created.id;localStorage.nexoraSessionId=activeId;sessions=await api("/api/sessions");}
    const activeSession=sessions.find(s=>s.id===activeId);
    const list=providers.dynamicProviders||[];
    view.innerHTML=card("Chat with Nexora",heading("Agent console","Send a direct request or queue a longer task. Provider selection is explicit; Nexora will not silently switch to a cloud provider.")+
      '<label class="cap-field"><span>Conversation</span><select id="chat-session">'+sessions.map(s=>'<option value="'+esc(s.id)+'"'+(s.id===activeId?" selected":"")+">'+esc(s.title)+" · "+esc(s.messageCount||0)+" messages</option>").join("")+'</select></label><div class="cap-actions">'+button("New conversation","session-new")+'<button class="icon-btn" type="button" data-ui-action="goto" data-id="sessions">Manage sessions</button></div>'+
      '<form id="ui-chat-form">'+field("Message","chat-message","Ask Nexora to inspect, plan, explain or create…")+
      '<label class="cap-field"><span>Provider override</span><select id="chat-provider"><option value="">Use configured default</option>'+list.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name||p.id)+'</option>').join("")+'</select></label>'+
      '<div class="cap-actions"><button class="primary" type="submit">Send message</button><button class="icon-btn" type="button" data-ui-action="queue-chat">Create queued task</button></div></form><div id="chat-result"></div>')+
      card("Local model catalog",'<p class="muted">'+esc((models||[]).length)+' model entries are available. Manage installation and selection in the Models page.</p><button class="icon-btn" data-ui-action="goto" data-id="models">Open Models →</button>');
  }
  async function sessionsPage(){
    const sessions=await api("/api/sessions");
    const rows=sessions.length?sessions.map(s=>'<div class="task-row"><div><b>'+esc(s.title)+'</b><small>'+esc(s.id)+' · '+esc(s.messageCount||0)+' messages</small><small>'+esc(s.updatedAt||s.createdAt||'')+'</small></div><div class="task-actions">'+button("Open in chat","session-open",s.id,"approve")+'</div></div>').join(""):'<p class="muted">No saved conversations yet. Open Chat to create one.</p>';
    view.innerHTML=card("Conversation history",heading("Persistent sessions","Chat messages are stored locally in the sessions data file. Undo removes transcript history only; it cannot reverse external tool actions.")+'<div class="cap-actions">'+button("New conversation","session-new","")+'<button class="icon-btn" data-ui-action="goto" data-id="chat">Open Chat</button></div>')+card("Saved sessions",rows);
  }
  async function tasks(){
    const [state,ts]=await Promise.all([api("/api/state"),api("/api/tasks")]);
    const rows=(ts||state.tasks||[]).slice().reverse().map(t=>'<div class="task-row"><div><b>'+esc(t.message||"Untitled task")+'</b><small>'+esc(t.id)+' · '+esc(t.provider||"default")+'</small><small>'+esc(t.updatedAt||t.createdAt||"")+'</small></div><div class="task-actions"><span class="badge '+esc(t.status||"unknown")+'">'+esc((t.status||"unknown").replaceAll("_"," "))+'</span>'+(t.status==="awaiting_approval"?button("Approve","task-approve",t.id,"approve")+button("Reject","task-cancel",t.id,"cancel"):"")+(t.status==="failed"?button("Retry","task-retry",t.id):"")+'</div></div>').join("");
    view.innerHTML=card("Task manager",'<div class="grid">'+stat("Total",(ts||[]).length)+stat("Waiting approval",(ts||[]).filter(t=>t.status==="awaiting_approval").length)+stat("Running",(ts||[]).filter(t=>t.status==="running").length)+stat("Failed",(ts||[]).filter(t=>t.status==="failed").length)+'</div><form id="ui-task-form">'+field("New task","task-message","Describe a task for the agent")+'<button class="primary" type="submit">Queue task</button></form>')+card("Task history",rows||'<p class="muted">No tasks created yet.</p>');
  }
  async function memory(){
    const q=new URLSearchParams(location.search).get("q")||"";
    const items=q?await api("/api/memory?q="+encodeURIComponent(q)+"&limit=100"):((await api("/api/state")).memory||[]).filter(m=>!m.archived);
    view.innerHTML=card("Memory explorer",'<form id="memory-search-form">'+field("Search memory","memory-query","Search stored notes",q)+'<button class="icon-btn" type="submit">Search</button></form><form id="memory-add-form">'+textarea("New memory","memory-content","Write a note to remember")+'<button class="primary" type="submit">Save memory</button></form>')+card("Stored entries",(items||[]).map(m=>'<div class="task-row"><div><b>'+esc(m.title||m.meta?.title||"Memory entry")+'</b><small>'+esc(m.createdAt||"")+'</small><p>'+esc(m.content||m.text||JSON.stringify(m))+'</p></div><div class="task-actions">'+button("Archive","memory-archive",m.id,"cancel")+button("Delete","memory-delete",m.id,"cancel")+'</div></div>').join("")||'<p class="muted">No matching memory entries.</p>');
  }
  async function models(){
    const result=await api("/api/models"),list=result.models||[];
    view.innerHTML=card("Model manager",heading("Local inference","Model actions depend on the installed LiteRT-LM runtime and model catalog. The UI reports backend results instead of pretending a download succeeded.")+"<p class=\"muted\">Active model: "+esc(result.active||"unknown")+"</p>"+(list||[]).map(m=>'<div class="task-row"><div><b>'+esc(m.name||m.id)+'</b><small>'+esc(m.id)+' · '+esc(m.provider||"provider unknown")+'</small><small>'+esc((m.cliInstalled?"LiteRT-LM CLI available":"LiteRT-LM CLI missing")+" · "+(m.active?"Active model":m.lastOk?"Last test passed":"Not yet tested")+" · "+(m.repo||""))+'</small></div><div class="task-actions">'+button("Test","model-test",m.id)+button("Use","model-use",m.id,"approve")+button("Check runtime","model-install",m.id)+'</div></div>').join("")||'<p class="muted">No models returned by the model catalog.</p>');
  }
  async function schedules(){
    const state=await api("/api/state"),list=state.schedules||[];
    view.innerHTML=card("Automation & schedules",'<p class="muted">Schedules run through the Nexora worker. Delay is in milliseconds. Recurring scheduling options are shown only when the backend exposes them.</p><form id="schedule-form">'+field("Task message","schedule-message","What should run?")+field("Delay (milliseconds)","schedule-delay","60000","60000","number")+'<button class="primary" type="submit">Create schedule</button></form>')+card("Scheduled jobs",list.map(s=>'<div class="task-row"><div><b>'+esc(s.message||s.name||"Scheduled task")+'</b><small>'+esc(s.id)+' · '+esc(s.status||"scheduled")+'</small><small>'+esc(s.runAt||s.nextRunAt||s.createdAt||"")+'</small></div>'+button("Cancel","schedule-cancel",s.id,"cancel")+'</div>').join("")||'<p class="muted">No scheduled jobs.</p>');
  }
  async function tools(){
    const [defs,sets,features]=await Promise.all([api("/api/tools"),api("/api/toolsets"),api("/api/features")]);
    view.innerHTML=card("Tool registry",'<p class="muted">Inspect registered tools and available toolsets. Risky actions should remain approval-gated.</p><pre>'+esc(JSON.stringify(defs,null,2))+'</pre>')+card("Toolsets",'<pre>'+esc(JSON.stringify(sets,null,2))+'</pre>')+card("Feature catalog",'<pre>'+esc(JSON.stringify(features.features||features,null,2))+'</pre>');
  }
  async function channels(){
    const [config,settings]=await Promise.all([api("/api/config"),api("/api/settings")]);
    const c=settings.channels||{};
    const channel=(name,label,enabled,envHint,description)=>'<div class="task-row"><div><b>'+label+'</b><small>'+esc(description)+'</small><small>Credentials: '+esc(envHint)+'</small></div><span class="badge '+(enabled?"completed":"unknown")+'">'+(enabled?"Enabled in UI preferences":"Not enabled")+'</span></div>';
    view.innerHTML=card("Messaging & event channels",'<p class="muted">This page shows channel preference and setup status. Secrets are intentionally not stored in browser settings. Set integration credentials in the host environment and restart the runtime; a UI toggle alone does not create a working bot.</p>'+
      channel("telegram","Telegram",!!c.telegramEnabled,"TELEGRAM_BOT_TOKEN","Bot channel status and setup guidance.")+
      channel("whatsapp","WhatsApp",!!c.whatsappEnabled,"WHATSAPP_* environment variables","WhatsApp gateway credentials depend on the selected supported connector.")+
      channel("webhook","Webhooks",!!c.webhookEnabled,"Host environment / reverse proxy","External webhook integrations require explicit network and authentication configuration.")+
      '<form id="channels-form"><label class="cap-check"><input type="checkbox" id="channel-telegram" '+(c.telegramEnabled?"checked":"")+'><span>Enable Telegram in preferences</span></label><label class="cap-check"><input type="checkbox" id="channel-whatsapp" '+(c.whatsappEnabled?"checked":"")+'><span>Enable WhatsApp in preferences</span></label><label class="cap-check"><input type="checkbox" id="channel-webhook" '+(c.webhookEnabled?"checked":"")+'><span>Enable webhook preference</span></label><button class="primary" type="submit">Save channel preferences</button></form>');
  }
  async function auditPage(){
    const list=await api("/api/audit");
    view.innerHTML=card("Audit trail",'<p class="muted">Audit records help trace task approvals and configuration changes.</p><div class="task-actions"><button class="icon-btn" data-ui-action="export-audit">Export JSON</button></div>')+card("Events",(list||[]).map(a=>'<div class="task-row"><div><b>'+esc(a.event||a.action||"event")+'</b><small>'+esc(a.createdAt||a.timestamp||"")+'</small><pre>'+esc(JSON.stringify(a,null,2))+'</pre></div></div>').join("")||'<p class="muted">No audit events recorded.</p>');
  }
  const sectionNames={general:"General",providers:"AI Providers",models:"Models",terminal:"Terminal",tools:"Tools",permissions:"Permissions",memory:"Memory",skills:"Skills",scheduler:"Scheduler",channels:"Channels",security:"Security",network:"Network",mcp:"MCP",logging:"Logging",backups:"Backups",system:"System",about:"About"};
  function settingsField(section,key,value){
    const id="setting-"+section+"-"+key, label=key.replace(/([A-Z])/g," $1").replace(/^./,x=>x.toUpperCase());
    if(typeof value==="boolean")return '<label class="cap-check"><input type="checkbox" id="'+id+'" data-section="'+section+'" data-key="'+key+'" '+(value?"checked":"")+'><span>'+esc(label)+'</span></label>';
    if(Array.isArray(value))return textarea(label,id,"JSON array",JSON.stringify(value)).replace("<textarea ","<textarea data-section=\""+section+"\" data-key=\""+key+"\" ");
    const choices={approvalMode:["ask","safe","trusted"],theme:["dark","light","system"],fallbackPolicy:["never","manual"],level:["debug","info","warn","error"]};
    if(choices[key])return '<label class="cap-field"><span>'+esc(label)+'</span><select id="'+id+'" data-section="'+section+'" data-key="'+key+'">'+choices[key].map(x=>'<option value="'+x+'" '+(x===value?"selected":"")+' >'+x+'</option>').join("")+'</select></label>';
    return field(label,id,"",value,typeof value==="number"?"number":"text").replace('<input ','<input data-section="'+section+'" data-key="'+key+'" ');
  }
  async function settings(){
    settingsCache=await api("/api/settings");
    const tabs=Object.keys(sectionNames).map(k=>'<button class="mini '+(k==="general"?"approve":"")+'" data-ui-action="settings-section" data-id="'+k+'">'+sectionNames[k]+'</button>').join("");
    const blocks=Object.entries(sectionNames).map(([key,label])=>card(label,'<form class="settings-form" data-section-form="'+key+'">'+Object.entries(settingsCache[key]||{}).map(([k,v])=>settingsField(key,k,v)).join("")+'<div class="cap-actions"><button class="primary" type="submit">Save '+label+'</button><button class="icon-btn" type="button" data-ui-action="settings-reset" data-id="'+key+'">Reset section</button></div></form>')).join("");
    view.innerHTML=card("Settings center",'<p class="muted">Preferences are persisted locally on the Nexora host. Provider credentials and bot tokens are deliberately excluded; configure those through environment variables. Some preferences are descriptive until a runtime component explicitly consumes them.</p><div class="cap-actions">'+tabs+'</div><input id="settings-filter" placeholder="Filter settings…" class="settings-filter">')+blocks;
    document.querySelectorAll("[data-section-form]").forEach(f=>f.closest(".card").style.display=f.dataset.sectionForm==="general"?"":"none");
    const filter=document.querySelector("#settings-filter");
    filter.oninput=()=>{const q=filter.value.toLowerCase();view.querySelectorAll("[data-section-form]").forEach(form=>{const matches=form.textContent.toLowerCase().includes(q)||form.dataset.sectionForm.includes(q);form.closest(".card").style.display=matches?"":"none"})};
  }
  async function system(){
    const [health,config,features,providers]=await Promise.all([api("/api/health"),api("/api/config"),api("/api/features"),api("/api/providers")]);
    view.innerHTML=card("System diagnostics",'<div class="grid">'+stat("Service",health.ok?"Healthy":"Unavailable")+stat("Version",health.version)+stat("OS",health.platform)+stat("Node.js",health.node)+stat("Bind host",config.host||"unknown")+stat("Port",config.port||"unknown")+stat("Approval mode",config.approvalMode||"unknown")+stat("Active provider",providers.active||"none")+'</div>')+card("Runtime configuration",'<pre>'+esc(JSON.stringify(config,null,2))+'</pre>')+card("Feature availability",'<pre>'+esc(JSON.stringify(features,null,2))+'</pre>');
  }
  async function npmPage(){
    const data=await api("/api/system/npm");
    const p=data.project||{},scripts=p.scripts||{},deps=p.dependencies||[],dev=p.devDependencies||[];
    const command=(name,label,desc)=>'<div class="task-row"><div><b>'+esc(label)+'</b><small>'+esc(desc)+'</small><pre>'+esc(name)+'</pre></div><button class="mini" data-ui-action="copy-command" data-id="'+esc(name)+'">Copy</button></div>';
    view.innerHTML=card("npm — JavaScript package manager",heading("npm / packages","A package manager for JavaScript, included with Node.js. npm makes it easy for developers to share and reuse code.")+
      '<div class="grid">'+stat("npm available",data.available?"Yes":"Not detected")+stat("npm version",data.version||"unavailable")+stat("Node.js",data.node)+stat("Project",p.name||"Nexora Agent")+stat("Project version",p.version||"unknown")+stat("Dependencies",deps.length)+stat("Dev dependencies",dev.length)+stat("node_modules",p.installed?"Installed":"Not installed")+stat("Lockfile",p.lockfile?"Present":"Not present")+'</div>')+
      card("Common npm commands",'<p class="muted">Run these from the Nexora project root in Linux/macOS terminals, Windows PowerShell/Terminal, or Termux. npm scripts are portable across supported Node.js environments.</p>'+
      command("npm install","Install dependencies","Resolve package.json dependencies and prepare the project.")+
      command("npm test","Run tests","Run the Node.js test suite.")+
      command("npm run check","Check JavaScript syntax","Check the main JavaScript entry points.")+
      command("npm start","Start Nexora","Start the API server and web dashboard.")+
      command("npm run worker","Start worker","Run the optional background worker process."))+
      card("Project scripts",'<pre>'+esc(JSON.stringify(scripts,null,2))+'</pre>')+
      card("Dependencies",'<p><b>Production</b></p><p>'+esc(deps.join(", ")||"None declared")+'</p><p><b>Development</b></p><p>'+esc(dev.join(", ")||"None declared")+'</p><p class="muted">Nexora does not install packages automatically from this page. Review package changes before installing new dependencies.</p>');
  }
  async function logs(){
    const [audit,state]=await Promise.all([api("/api/audit"),api("/api/state")]);
    view.innerHTML=card("Runtime logs",'<p class="muted">The web API currently exposes audit events and task state, not arbitrary host log files. Use the terminal command shown for service stdout/stderr.</p><pre>npm start\n# worker process (optional)\nnpm run worker</pre><div class="cap-actions"><button class="icon-btn" data-ui-action="export-audit">Export audit JSON</button><button class="icon-btn" data-ui-action="goto" data-id="system">System diagnostics →</button></div>')+card("Latest events",(audit||[]).slice(0,100).map(a=>'<div class="task-row"><div><b>'+esc(a.event||a.action||"event")+'</b><small>'+esc(a.createdAt||a.timestamp||"")+'</small><pre>'+esc(JSON.stringify(a,null,2))+'</pre></div></div>').join("")||'<p class="muted">No events.</p>')+card("Queue snapshot",'<pre>'+esc(JSON.stringify(state.queue||{},null,2))+'</pre>');
  }
  const pages={dashboard,chat,sessions:sessionsPage,tasks,memory,models,schedules,tools,channels,audit:auditPage,settings,system,npm:npmPage,logs};
  async function render(page){
    active=page;document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.v===page));
    const title=document.querySelector("#page-title");if(title)title.textContent=titles[page]||page;
    try{await (pages[page]||dashboard)()}catch(e){view.innerHTML=card("Could not load "+esc(titles[page]||page),'<p class="danger">'+esc(e.message)+'</p><button class="icon-btn" data-ui-action="retry">Retry</button>')}
  }
  document.addEventListener("click",async e=>{
    const nav=e.target.closest(".nav[data-v]");if(nav&&!["providers","mcp","skills"].includes(nav.dataset.v)){e.preventDefault();e.stopImmediatePropagation();history.pushState({},"","/"+nav.dataset.v);render(nav.dataset.v);return}
    const b=e.target.closest("[data-ui-action]");if(!b)return;
    const a=b.dataset.uiAction,id=b.dataset.id;
    try{
      if(a==="goto"){render(id);return}
      if(a==="session-new"){const created=await api("/api/sessions",{method:"POST",body:JSON.stringify({title:"New conversation"})});localStorage.nexoraSessionId=created.id;toast("New conversation created");render("chat");return}
      if(a==="session-open"){localStorage.nexoraSessionId=id;history.pushState({},"","/chat");render("chat");return}
      if(a==="retry"){render(active);return}
      if(a==="copy-command"){await navigator.clipboard.writeText(id);toast("Copied command");return}
      if(a==="settings-section"){document.querySelectorAll("[data-section-form]").forEach(f=>f.closest(".card").style.display=f.dataset.sectionForm===id?"":"none");return}
      if(a==="settings-reset"){await api("/api/settings/"+encodeURIComponent(id),{method:"DELETE",body:"{}"});settingsCache=await api("/api/settings");toast("Section restored to defaults");render("settings");return}
      if(a==="export-audit"){const data=await api("/api/audit");const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download="nexora-audit.json";link.click();URL.revokeObjectURL(url);return}
      if(a==="queue-chat"){const message=document.querySelector("#chat-message")?.value.trim();if(!message)throw Error("Enter a message first");const provider=document.querySelector("#chat-provider")?.value||undefined;const result=await api("/api/tasks",{method:"POST",body:JSON.stringify({message,provider})});toast("Task queued");render("tasks");return}
      if(a==="task-approve"||a==="task-cancel"){await api("/api/tasks/"+encodeURIComponent(id)+"/"+(a==="task-approve"?"approve":"cancel"),{method:"POST",body:"{}"});toast("Task action complete");render("tasks");return}
      if(a==="task-retry"){await api("/api/tasks/"+encodeURIComponent(id)+"/retry",{method:"POST",body:"{}"});toast("Retry queued");render("tasks");return}
      if(a==="open-task"){render("tasks");return}
      if(a==="model-test"||a==="model-use"||a==="model-install"){const op=a.slice(6);const result=await api("/api/models/"+encodeURIComponent(id)+"/"+op,{method:"POST",body:"{}"});toast(op==="use"?"Active model updated":op==="test"?(result.ok?"Model test passed":"Model test did not pass"):"Runtime check completed");await render("models");const target=view.querySelector(".card");if(target)target.insertAdjacentHTML("beforeend",'<pre>'+esc(JSON.stringify(result,null,2))+'</pre>');return}
      if(a==="memory-archive"){await api("/api/memory/"+encodeURIComponent(id)+"/archive",{method:"POST",body:"{}"});toast("Memory archived");render("memory");return}
      if(a==="memory-delete"){if(!confirm("Permanently delete this memory entry?"))return;await api("/api/memory/"+encodeURIComponent(id),{method:"DELETE",body:"{}"});toast("Memory deleted");render("memory");return}
      if(a==="schedule-cancel"){await api("/api/schedules/"+encodeURIComponent(id)+"/cancel",{method:"POST",body:"{}"});toast("Schedule cancelled");render("schedules");return}
    }catch(err){toast(err.message)}
  },true);
  document.addEventListener("change",e=>{if(e.target?.id==="chat-session"){localStorage.nexoraSessionId=e.target.value;render("chat")}});
  document.addEventListener("submit",async e=>{
    const form=e.target;
    try{
      if(form.id==="ui-chat-form"){e.preventDefault();const message=document.querySelector("#chat-message").value.trim();if(!message)throw Error("Enter a message");const provider=document.querySelector("#chat-provider").value||undefined;const target=document.querySelector("#chat-result");target.innerHTML='<div class="card"><p class="muted">Working…</p></div>';const result=await api("/api/chat",{method:"POST",body:JSON.stringify({message,provider,sessionId:localStorage.nexoraSessionId||undefined})});target.innerHTML='<div class="card"><h3>Agent response</h3><pre>'+esc(JSON.stringify(result,null,2))+'</pre>'+(result.status==="awaiting_approval"?'<p class="muted">This action is waiting for approval. Review it in Tasks.</p>':'')+'</div>';return}
      if(form.id==="ui-task-form"){e.preventDefault();const message=document.querySelector("#task-message").value.trim();if(!message)throw Error("Task message is required");await api("/api/tasks",{method:"POST",body:JSON.stringify({message})});toast("Task added to queue");render("tasks");return}
      if(form.id==="memory-search-form"){e.preventDefault();const q=document.querySelector("#memory-query").value.trim();history.replaceState(null,"",q?"?q="+encodeURIComponent(q):location.pathname);render("memory");return}
      if(form.id==="memory-add-form"){e.preventDefault();const content=document.querySelector("#memory-content").value.trim();if(!content)throw Error("Memory content is required");await api("/api/memory",{method:"POST",body:JSON.stringify({content,meta:{source:"dashboard"}})});toast("Memory saved");render("memory");return}
      if(form.id==="schedule-form"){e.preventDefault();const message=document.querySelector("#schedule-message").value.trim(),delayMs=Number(document.querySelector("#schedule-delay").value);if(!message||!Number.isFinite(delayMs)||delayMs<0)throw Error("Enter a task and a valid delay");await api("/api/schedules",{method:"POST",body:JSON.stringify({message,delayMs})});toast("Schedule created");render("schedules");return}
      if(form.id==="channels-form"){e.preventDefault();const patch={channels:{telegramEnabled:document.querySelector("#channel-telegram").checked,whatsappEnabled:document.querySelector("#channel-whatsapp").checked,webhookEnabled:document.querySelector("#channel-webhook").checked}};await api("/api/settings",{method:"PUT",body:JSON.stringify(patch)});toast("Channel preferences saved");render("channels");return}
      if(form.matches("[data-section-form]")){e.preventDefault();const section=form.dataset.sectionForm,patch={};form.querySelectorAll("[data-key]").forEach(el=>{let value;if(el.type==="checkbox")value=el.checked;else if(el.type==="number")value=Number(el.value);else if(Array.isArray(settingsCache[section]?.[el.dataset.key])){try{value=JSON.parse(el.value)}catch{throw Error("Enter a valid JSON array for "+el.dataset.key)}if(!Array.isArray(value))throw Error(el.dataset.key+" must be a JSON array")}else value=el.value;patch[el.dataset.key]=value});await api("/api/settings",{method:"PUT",body:JSON.stringify({[section]:patch})});toast(sectionNames[section]+" saved");settingsCache=await api("/api/settings");return}
    }catch(err){e.preventDefault();toast(err.message)}
  },true);
  const style=document.createElement("style");style.textContent='.cap-field{display:grid;gap:6px;margin:12px 0;color:var(--muted);font-size:12px}.cap-field input,.cap-field textarea,.cap-field select,.settings-filter{width:100%;background:#080d16;color:var(--text);border:1px solid #293650;border-radius:10px;padding:11px}.cap-field textarea{min-height:80px}.cap-actions,.task-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:12px 0}.cap-check{display:flex;align-items:center;gap:10px;padding:8px 0;color:var(--muted)}.settings-filter{margin:10px 0 16px}.mini{border:1px solid #30405e;background:#121b2c;color:#fff;border-radius:8px;padding:7px 10px;cursor:pointer;font-size:11px}.mini.cancel{border-color:#66404b;color:#ff9aab}.mini.approve{border-color:#3c665b;color:#8ce8c5}.task-row pre{max-width:100%;max-height:280px}';document.head.append(style);
  window.NexoraUiPages={render};
  window.addEventListener("popstate",()=>{const page=location.pathname.slice(1)||"dashboard";if(["providers","mcp","skills"].includes(page)&&window.NexoraCapabilities)window.NexoraCapabilities.render(page);else render(page)});
})();