(() => {
  const view = document.querySelector("#view");
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
    const [library, skills] = await Promise.all([api("/api/skills/library"),api("/api/skills")]);
    const sources=(library.sources||[]).map(s=>'<div class="task-row"><div><b>'+esc(s.name)+'</b><small>'+esc(s.url)+'</small></div></div>').join("") || '<p class="muted">No custom sources yet.</p>';
    const rows=skills.length?skills.slice().reverse().map(s=>{
      const actions=s.status==="proposed"?btn("skill-approve",s.id,"Approve"):s.status==="active"?btn("skill-disable",s.id,"Disable"):btn("skill-rollback",s.id,"Rollback",true);
      return '<div class="task-row"><div><b>'+esc(s.name)+' <span class="tag">v'+esc(s.version)+'</span></b><small>'+esc(s.description||"No description")+'</small><small>Status: '+esc(s.status)+(s.external?' · external source':'')+'</small>'+(s.source?.securityFindings?.length?'<small class="danger">Security findings: '+esc(s.source.securityFindings.join(", "))+'</small>':'')+'</div><div class="task-actions">'+actions+'</div></div>';
    }).join(""):'<p class="muted">No skills yet. Inspect a SKILL.md URL and import it as a proposal.</p>';
    view.innerHTML = card("Skills Hub", '<p class="muted">External instructions are untrusted. Import creates a proposal only; nothing becomes active without explicit approval.</p><form id="skill-inspect-form">'+field("Direct HTTPS SKILL.md URL","skill-url","https://raw.githubusercontent.com/.../SKILL.md")+field("Optional skill name","skill-name","leave blank to use frontmatter")+'<div class="cap-actions"><button class="primary" type="submit">Inspect URL</button><button type="button" class="icon-btn" data-cap-action="skill-import">Import as proposal</button></div></form><div id="skill-preview"></div>') + card("Existing skills",rows) + card("Add a trusted source", '<form id="skill-source-form">'+field("Source name","source-name","team-skills")+field("Source HTTPS URL","source-url","https://example.com/skills")+'<button class="primary" type="submit">Save source</button></form>') + card("Skill sources",sources) + card("Catalog hints",'<p class="muted">'+esc((library.hermes?.sources||[]).map(x=>x.name+": "+x.installHint).join("\n"))+'</p>');
  }
  document.addEventListener("click", async event => {
    const nav=event.target.closest(".nav[data-v]");
    if(nav && (nav.dataset.v==="mcp" || nav.dataset.v==="skills")) {
      event.preventDefault(); event.stopImmediatePropagation();
      document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b===nav));
      const title=document.querySelector("#page-title"); if(title) title.textContent=nav.dataset.v==="mcp"?"MCP Servers":"Skills Hub";
      try { await (nav.dataset.v==="mcp"?mcpPage():skillsPage()); } catch(e){view.innerHTML=card("Unable to load",'<p class="danger">'+esc(e.message)+'</p>');}
      return;
    }
    const action=event.target.closest("[data-cap-action]"); if(!action)return;
    const kind=action.dataset.capAction,id=action.dataset.id;
    try {
      if(kind==="mcp-connect"){await api("/api/mcp/"+encodeURIComponent(id),{method:"POST",body:"{}"});toast("MCP server connected");await mcpPage();}
      if(kind==="mcp-remove"){if(!confirm("Remove MCP server "+id+"? This stops its connection and removes its registration."))return;await api("/api/mcp/"+encodeURIComponent(id),{method:"DELETE",body:"{}"});toast("MCP server removed");await mcpPage();}
      if(kind.startsWith("skill-")){const op=kind.slice(6);if(op==="rollback"&&!confirm("Roll back this skill?"))return;await api("/api/skills/"+encodeURIComponent(id)+"/"+op,{method:"POST",body:"{}"});toast("Skill "+op+" complete");await skillsPage();}
      if(kind==="skill-import"){const url=document.querySelector("#skill-url")?.value.trim();const name=document.querySelector("#skill-name")?.value.trim();if(!url)throw Error("Enter a SKILL.md URL and inspect it first.");const result=await api("/api/skills/import",{method:"POST",body:JSON.stringify({url,name,trust:"community"})});toast("Imported as proposal; approval required");await skillsPage();}
    } catch(e){toast(e.message);}
  }, true);
  document.addEventListener("submit", async event=>{
    if(!["mcp-form","skill-inspect-form","skill-source-form"].includes(event.target.id))return;
    event.preventDefault();
    try{
      if(event.target.id==="mcp-form"){
        let args;try{args=JSON.parse(document.querySelector("#mcp-args").value||"[]");}catch{throw Error("Arguments must be a valid JSON array.");}
        if(!Array.isArray(args)||args.some(x=>typeof x!=="string"))throw Error("Arguments must be a JSON array of strings.");
        const body={name:document.querySelector("#mcp-name").value.trim(),command:document.querySelector("#mcp-command").value.trim(),args,timeout:Number(document.querySelector("#mcp-timeout").value)||15000};
        if(!body.name||!body.command)throw Error("Server name and executable are required.");
        await api("/api/mcp",{method:"POST",body:JSON.stringify(body)});toast("MCP server registered and connected");await mcpPage();
      } else if(event.target.id==="skill-inspect-form"){
        const url=document.querySelector("#skill-url").value.trim();if(!url)throw Error("Enter a direct HTTPS SKILL.md URL.");
        const info=await api("/api/skills/inspect",{method:"POST",body:JSON.stringify({url})});
        const preview=document.querySelector("#skill-preview");
        preview.innerHTML='<div class="card"><span class="eyebrow">INSPECTION ONLY · NOT ACTIVE</span><h3>'+esc(info.name)+'</h3><p>'+esc(info.description)+'</p><small class="muted">'+esc(info.source)+' · '+esc(info.size)+' characters</small><pre>'+esc(info.content)+'</pre><p class="muted">Use “Import as proposal” after reviewing these instructions.</p></div>';
        toast("Skill inspected; not installed");
      } else {
        const name=document.querySelector("#source-name").value.trim(),url=document.querySelector("#source-url").value.trim();
        await api("/api/skills/sources",{method:"POST",body:JSON.stringify({name,url})});toast("Skill source saved");await skillsPage();
      }
    }catch(e){toast(e.message);}
  });
  const style=document.createElement("style");style.textContent='.cap-field{display:grid;gap:6px;margin:12px 0;color:var(--muted);font-size:12px}.cap-field input,.cap-field textarea{width:100%;background:#080d16;color:var(--text);border:1px solid #293650;border-radius:10px;padding:11px}.cap-field textarea{min-height:70px}.cap-actions,.task-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.mini{border:1px solid #30405e;background:#121b2c;color:#fff;border-radius:8px;padding:7px 10px;cursor:pointer;font-size:11px}.mini.cancel{border-color:#66404b;color:#ff9aab}.mini.approve{border-color:#3c665b;color:#8ce8c5}';document.head.append(style);
})();