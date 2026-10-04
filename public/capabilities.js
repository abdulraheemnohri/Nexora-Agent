(() => {
  const view = document.querySelector("#view");
  let inspectedSkillUrl = "";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const api = async (url, options = {}) => {
    const token = localStorage.nexoraToken || "";
    const response = await fetch(url, { ...options, headers: { "content-type":"application/json", authorization:"Bearer "+token, ...(options.headers||{}) } });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || "Request failed");
    return data;
  };
  const toast = message => { const el=document.querySelector("#toast"); if(el){el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400);} };
  const btn = (action, id, label, danger=false) => '<button class="mini '+(danger?'cancel':'approve')+'" data-cap-action="'+action+'" data-id="'+esc(id)+'">'+label+'</button>';
  const field = (label, id, placeholder, value="", type="text") => '<label class="cap-field"><span>'+label+'</span><input id="'+id+'" type="'+type+'" placeholder="'+esc(placeholder)+'" value="'+esc(value)+'"></label>';
  const area = (label,id,placeholder,value="") => '<label class="cap-field"><span>'+label+'</span><textarea id="'+id+'" placeholder="'+esc(placeholder)+'">'+esc(value)+'</textarea></label>';
  const card = (title, body) => '<div class="card"><h2>'+title+'</h2>'+body+'</div>';
  async function providerPage() {
    const [result,presets] = await Promise.all([api("/api/providers"),api("/api/providers/presets")]);
    const providers=result.dynamicProviders||[];
    const rows=providers.length?providers.map(p=>'<div class="task-row"><div><b>'+esc(p.name||p.id)+(result.active===p.id?' <span class="tag">ACTIVE</span>':'')+'</b><small>'+esc(p.type)+' · '+esc(p.baseUrl||p.command||"")+'</small><small>Model: '+esc(p.model||"not set")+' · '+(p.enabled===false?'Disabled':p.configured?'Configured':'Needs configuration')+'</small></div><div class="task-actions"><button class="mini approve" data-cap-action="provider-use" data-id="'+esc(p.id)+'">Use</button><button class="mini" data-cap-action="provider-test" data-id="'+esc(p.id)+'">Test</button><button class="mini" data-cap-action="provider-models" data-id="'+esc(p.id)+'">Discover models</button><button class="mini cancel" data-cap-action="provider-remove" data-id="'+esc(p.id)+'">Remove</button></div></div>').join(""):'<p class="muted">No dynamic providers yet.</p>';
    const opts=presets.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' · '+esc(p.model)+'</option>').join("");
    view.innerHTML=card("Add a provider preset",'<p class="muted">Presets are configuration templates. Supply your own credential where required; secrets are not shown in the dashboard.</p><form id="provider-preset-form"><label class="cap-field"><span>Provider preset</span><select id="provider-preset">'+opts+'</select></label>'+field("API key (optional for local providers)","provider-preset-key","API key","")+'<button class="primary" type="submit">Add preset</button></form>')+
      card("Add custom OpenAI-compatible provider",'<form id="provider-form">'+field("Provider ID","provider-id","my-local-model")+field("Display name","provider-name","My Local Model")+field("Base URL","provider-url","http://127.0.0.1:11434/v1")+field("Model ID","provider-model","model-name")+field("API key (optional)","provider-key","")+'<button class="primary" type="submit">Add provider</button></form>')+
      card("Configured providers",rows+'<div id="provider-results"></div>');
  }
  async function mcpPage() {
    const [servers,status] = await Promise.all([api("/api/mcp"),api("/api/mcp/status")]);
    const states = new Map(status.map(s=>[s.name,s]));
    const rows = servers.length ? servers.map(s=>{
      const st=states.get(s.name)||{};
      return '<div class="task-row"><div><b>'+esc(s.name)+'</b><small>'+esc(s.command)+' '+esc((s.args||[]).join(" "))+'</small><small>'+ (s.enabled===false?'Disabled':st.connected?'Connected · '+(st.toolCount||0)+' tools':'Registered · not connected')+'</small></div><div class="task-actions">'+btn("mcp-connect",s.name,"Connect")+btn("mcp-remove",s.name,"Remove",true)+'</div></div>';
    }).join("") : '<p class="muted">No MCP servers registered yet.</p>';
    view.innerHTML = card("Register an MCP server", '<p class="muted">Commands run on this machine. Only add servers and packages you trust. Use an executable and pass arguments separately; Nexora does not invoke a shell for MCP startup.</p><form id="mcp-form">'+field("Server name","mcp-name","e.g. docs-server")+field("Executable / command","mcp-command","e.g. npx")+field("Arguments (JSON array)","mcp-args","[\"-y\",\"package-name\"]",'[]')+field("Startup timeout (ms)","mcp-timeout","15000","15000","number")+'<button class="primary" type="submit">Register & connect</button></form>') + card("Registered servers", rows);
  }
  async function skillsPage() {
    inspectedSkillUrl = "";
    const [library, skills] = await Promise.all([api("/api/skills/library"),api("/api/skills")]);
    const sources=(library.sources||[]).map(s=>'<div class="task-row"><div><b>'+esc(s.name)+'</b><small>'+esc(s.url)+'</small></div></div>').join("") || '<p class="muted">No custom sources yet.</p>';
    const rows=skills.length?skills.slice().reverse().map(s=>{
      const actions=s.status==="proposed"?btn("skill-approve",s.id,"Approve"):s.status==="active"?btn("skill-run",s.id,"Run skill")+btn("skill-disable",s.id,"Disable"):btn("skill-rollback",s.id,"Rollback",true);
      return '<div class="task-row"><div><b>'+esc(s.name)+' <span class="tag">v'+esc(s.version)+'</span></b><small>'+esc(s.description||"No description")+'</small><small>Status: '+esc(s.status)+(s.external?' · external source':'')+'</small>'+(s.source?.securityFindings?.length?'<small class="danger">Security findings: '+esc(s.source.securityFindings.join(", "))+'</small>':'')+'</div><div class="task-actions">'+actions+'</div></div>';
    }).join(""):'<p class="muted">No skills yet. Inspect a SKILL.md URL and import it as a proposal.</p>';
    view.innerHTML = card("Skills Hub", '<p class="muted">External instructions are untrusted. Import creates a proposal only; nothing becomes active without explicit approval.</p><form id="skill-inspect-form">'+field("Direct HTTPS SKILL.md URL","skill-url","https://raw.githubusercontent.com/.../SKILL.md")+field("Optional skill name","skill-name","leave blank to use frontmatter")+'<div class="cap-actions"><button class="primary" type="submit">Inspect URL</button><button type="button" class="icon-btn" data-cap-action="skill-import">Import as proposal</button></div></form><div id="skill-preview"></div>') + card("Existing skills",rows) + card("Add a trusted source", '<form id="skill-source-form">'+field("Source name","source-name","team-skills")+field("Source HTTPS URL","source-url","https://example.com/skills")+'<button class="primary" type="submit">Save source</button></form>') + card("Skill sources",sources) + card("Catalog hints",'<p class="muted">'+esc((library.hermes?.sources||[]).map(x=>x.name+": "+x.installHint).join("\n"))+'</p>');
  }
  document.addEventListener("click", async event => {
    const nav=event.target.closest(".nav[data-v]");
    if(nav && (nav.dataset.v==="mcp" || nav.dataset.v==="skills" || nav.dataset.v==="providers")) {
      event.preventDefault(); event.stopImmediatePropagation(); history.pushState({},"","/"+nav.dataset.v);
      document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b===nav));
      const title=document.querySelector("#page-title"); if(title) title.textContent=nav.dataset.v==="mcp"?"MCP Servers":nav.dataset.v==="skills"?"Skills Hub":"AI Providers";
      try { await (nav.dataset.v==="mcp"?mcpPage():nav.dataset.v==="skills"?skillsPage():providerPage()); } catch(e){view.innerHTML=card("Unable to load",'<p class="danger">'+esc(e.message)+'</p>');}
      return;
    }
    const action=event.target.closest("[data-cap-action]"); if(!action)return;
    const kind=action.dataset.capAction,id=action.dataset.id;
    try {
      if(kind==="provider-use"){await api("/api/providers/"+encodeURIComponent(id)+"/use",{method:"POST",body:"{}"});toast("Active provider updated");await providerPage();}
      if(kind==="provider-test"){const result=await api("/api/providers/"+encodeURIComponent(id)+"/test",{method:"POST",body:JSON.stringify({prompt:"Reply with exactly: NEXORA_PROVIDER_OK"})});const target=document.querySelector("#provider-results");if(target)target.innerHTML='<div class="card"><h3>Connection test · '+esc(id)+'</h3><pre>'+esc(JSON.stringify(result,null,2))+'</pre></div>';toast(result.ok?"Provider connection succeeded":"Provider test failed");}
      if(kind==="provider-models"){const result=await api("/api/providers/"+encodeURIComponent(id)+"/models");const target=document.querySelector("#provider-results");if(target)target.innerHTML='<div class="card"><h3>Models · '+esc(id)+'</h3>'+(result.models||[]).map(m=>'<div class="task-row"><div>'+esc(m.id)+'</div><button class="mini approve" data-cap-action="provider-select-model" data-id="'+esc(id)+'" data-model="'+esc(m.id)+'">Use model</button></div>').join("")+'<pre>'+esc(JSON.stringify(result,null,2))+'</pre></div>';toast("Model discovery complete");}
      if(kind==="provider-select-model"){await api("/api/providers/"+encodeURIComponent(id),{method:"PUT",body:JSON.stringify({model:action.dataset.model})});toast("Provider model updated");await providerPage();}
      if(kind==="provider-remove"){if(!confirm("Remove provider "+id+"?"))return;await api("/api/providers/"+encodeURIComponent(id),{method:"DELETE",body:"{}"});toast("Provider removed");await providerPage();}
      if(kind==="mcp-connect"){await api("/api/mcp/"+encodeURIComponent(id),{method:"POST",body:"{}"});toast("MCP server connected");await mcpPage();}
      if(kind==="mcp-remove"){if(!confirm("Remove MCP server "+id+"? This stops its connection and removes its registration."))return;await api("/api/mcp/"+encodeURIComponent(id),{method:"DELETE",body:"{}"});toast("MCP server removed");await mcpPage();}
      if(kind==="skill-run"){const input=prompt("What should this approved skill do?");if(input===null)return;if(!input.trim())throw Error("A task description is required.");const result=await api("/api/skills/"+encodeURIComponent(id)+"/run",{method:"POST",body:JSON.stringify({input:input.trim()})});toast("Skill task queued: "+result.task.id);history.pushState({},"","/tasks");document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.v==="tasks"));const title=document.querySelector("#page-title");if(title)title.textContent="Tasks";await window.dispatchEvent(new PopStateEvent("popstate"));return;} if(kind.startsWith("skill-")){const op=kind.slice(6);if(op==="rollback"&&!confirm("Roll back this skill?"))return;await api("/api/skills/"+encodeURIComponent(id)+"/"+op,{method:"POST",body:"{}"});toast("Skill "+op+" complete");await skillsPage();}
      if(kind==="skill-import"){const url=document.querySelector("#skill-url")?.value.trim();const name=document.querySelector("#skill-name")?.value.trim();if(!url||url!==inspectedSkillUrl)throw Error("Inspect this exact SKILL.md URL before importing.");const result=await api("/api/skills/import",{method:"POST",body:JSON.stringify({url,name,trust:"community"})});toast("Imported as proposal; approval required");await skillsPage();}
    } catch(e){toast(e.message);}
  }, true);
  document.addEventListener("submit", async event=>{
    if(!["mcp-form","skill-inspect-form","skill-source-form","provider-form","provider-preset-form"].includes(event.target.id))return;
    event.preventDefault();
    try{
      if(event.target.id==="provider-preset-form"){const id=document.querySelector("#provider-preset").value,apiKey=document.querySelector("#provider-preset-key").value;await api("/api/providers/presets",{method:"POST",body:JSON.stringify({id,apiKey})});toast("Provider preset added");await providerPage();
      } else if(event.target.id==="provider-form"){const body={id:document.querySelector("#provider-id").value.trim(),name:document.querySelector("#provider-name").value.trim(),type:"openai-compatible",baseUrl:document.querySelector("#provider-url").value.trim(),model:document.querySelector("#provider-model").value.trim(),apiKey:document.querySelector("#provider-key").value};if(!body.id||!body.baseUrl||!body.model)throw Error("Provider ID, base URL and model are required.");await api("/api/providers",{method:"POST",body:JSON.stringify(body)});toast("Provider added");await providerPage();
      } else if(event.target.id==="mcp-form"){
        let args;try{args=JSON.parse(document.querySelector("#mcp-args").value||"[]");}catch{throw Error("Arguments must be a valid JSON array.");}
        if(!Array.isArray(args)||args.some(x=>typeof x!=="string"))throw Error("Arguments must be a JSON array of strings.");
        const body={name:document.querySelector("#mcp-name").value.trim(),command:document.querySelector("#mcp-command").value.trim(),args,timeout:Number(document.querySelector("#mcp-timeout").value)||15000};
        if(!body.name||!body.command)throw Error("Server name and executable are required.");
        await api("/api/mcp",{method:"POST",body:JSON.stringify(body)});toast("MCP server registered and connected");await mcpPage();
      } else if(event.target.id==="skill-inspect-form"){
        const url=document.querySelector("#skill-url").value.trim();if(!url)throw Error("Enter a direct HTTPS SKILL.md URL.");
        const info=await api("/api/skills/inspect",{method:"POST",body:JSON.stringify({url})});
        inspectedSkillUrl=url;
        const preview=document.querySelector("#skill-preview");
        preview.innerHTML='<div class="card"><span class="eyebrow">INSPECTION ONLY · NOT ACTIVE</span><h3>'+esc(info.name)+'</h3><p>'+esc(info.description)+'</p><small class="muted">'+esc(info.source)+' · '+esc(info.size)+' characters</small><pre>'+esc(info.content)+'</pre><p class="muted">Use “Import as proposal” after reviewing these instructions.</p></div>';
        toast("Skill inspected; not installed");
      } else {
        const name=document.querySelector("#source-name").value.trim(),url=document.querySelector("#source-url").value.trim();
        await api("/api/skills/sources",{method:"POST",body:JSON.stringify({name,url})});toast("Skill source saved");await skillsPage();
      }
    }catch(e){toast(e.message);}
  });
  window.NexoraCapabilities={render:async page=>{const title=document.querySelector("#page-title");if(title)title.textContent=page==="mcp"?"MCP Servers":page==="skills"?"Skills Hub":"AI Providers";document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.v===page));try{await (page==="mcp"?mcpPage():page==="skills"?skillsPage():providerPage())}catch(e){view.textContent=e.message}}};
  const style=document.createElement("style");style.textContent='.cap-field{display:grid;gap:6px;margin:12px 0;color:var(--muted);font-size:12px}.cap-field input,.cap-field textarea{width:100%;background:#080d16;color:var(--text);border:1px solid #293650;border-radius:10px;padding:11px}.cap-field textarea{min-height:70px}.cap-actions,.task-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.mini{border:1px solid #30405e;background:#121b2c;color:#fff;border-radius:8px;padding:7px 10px;cursor:pointer;font-size:11px}.mini.cancel{border-color:#66404b;color:#ff9aab}.mini.approve{border-color:#3c665b;color:#8ce8c5}';document.head.append(style);
})();