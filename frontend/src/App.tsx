import { useEffect, useState } from "react";
import { Activity, BrainCircuit, Cpu, Send, ShieldCheck, Sparkles, KeyRound, RefreshCw, Check, X, RotateCcw } from "lucide-react";

const API = "http://127.0.0.1:8000";
type Skill = {id:number;name:string;description:string;instructions:string;status:string;version:number};
export default function App() {
  const [message,setMessage] = useState("");
  const [answer,setAnswer] = useState("Nexora is ready. Start the API, then send a message.");
  const [provider,setProvider] = useState("local");
  const [busy,setBusy] = useState(false);
  const [health,setHealth] = useState("checking");
  const [skills,setSkills] = useState<Skill[]>([]);
  const [token,setToken] = useState("");
  const [showToken,setShowToken] = useState(false);
  const [skillName,setSkillName] = useState("");
  const [skillDescription,setSkillDescription] = useState("");
  const [skillInstructions,setSkillInstructions] = useState("");
  const [skillBusy,setSkillBusy] = useState(false);
  const [notice,setNotice] = useState("");
  function headers(json=false):Record<string,string> {
    return {...(json?{"Content-Type":"application/json"}:{}),...(token.trim()?{Authorization:"Bearer "+token.trim()}: {})};
  }
  async function refreshSkills() {
    try { const r=await fetch(API+"/v1/skills",{headers:headers()}); if(!r.ok) throw new Error(r.status===401?"API token rejected":"Unable to load skills"); setSkills(await r.json()); setNotice(""); }
    catch(e) { setNotice(e instanceof Error?e.message:"Unable to load skills"); }
  }
  useEffect(()=>{fetch(API+"/health").then(r=>r.json()).then(()=>setHealth("online")).catch(()=>setHealth("offline"));},[]);
  useEffect(()=>{void refreshSkills();},[token]);
  async function send() {
    if (!message.trim() || busy) return;
    setBusy(true); setAnswer("");
    try { const r=await fetch(API+"/v1/chat/completions",{method:"POST",headers:headers(true),body:JSON.stringify({message,provider})}); const data=await r.json(); if(!r.ok) throw new Error(data.detail||"Request failed"); setAnswer(data.response); }
    catch(e) { setAnswer(e instanceof Error ? e.message : "Unable to connect. Start the Nexora API."); }
    finally { setBusy(false); }
  }
  async function createSkill() {
    if(!skillName.trim()||!skillDescription.trim()||!skillInstructions.trim()) return;
    setSkillBusy(true);
    try {
      const r=await fetch(API+"/v1/skills",{method:"POST",headers:headers(true),body:JSON.stringify({name:skillName,description:skillDescription,instructions:skillInstructions})});
      const data=await r.json(); if(!r.ok) throw new Error(data.detail||"Could not propose skill");
      setSkillName("");setSkillDescription("");setSkillInstructions("");setNotice("Skill proposed. Run its checks before approval.");await refreshSkills();
    } catch(e) { setNotice(e instanceof Error?e.message:"Could not create skill"); }
    finally { setSkillBusy(false); }
  }
  async function skillAction(id:number,action:"test"|"approve"|"reject"|"rollback") {
    try {
      const url=action==="test"?`${API}/v1/skills/${id}/test`:action==="rollback"?`${API}/v1/skills/${id}/rollback`:`${API}/v1/skills/${id}/decision`;
      const r=await fetch(url,{method:"POST",headers:headers(true),...(action==="approve"||action==="reject"?{body:JSON.stringify({decision:action})}:{body:JSON.stringify({})})});
      const data=await r.json();if(!r.ok) throw new Error(data.detail||"Skill action failed");
      setNotice(action==="test"?(data.passed?"Static skill checks passed.":"Static checks found issues: "+(data.issues||[]).join(", ")): "Skill updated: "+action);
      await refreshSkills();
    } catch(e) {setNotice(e instanceof Error?e.message:"Skill action failed");}
  }
  return <main className="shell">
    <aside className="sidebar"><div className="brand"><div className="brandIcon"><BrainCircuit size={24}/></div><div><b>NEXORA</b><small>SELF-GROWING AGENT</small></div></div>
      <div className="nav active"><Activity size={18}/> Overview</div><div className="nav"><Cpu size={18}/> Model gateway</div><div className="nav"><Sparkles size={18}/> Skill learning</div><div className="nav"><ShieldCheck size={18}/> Safety & audit</div>
      <div className="sideStatus"><span className={health==="online"?"dot":"dot muted"}/><div><b>Gateway {health}</b><small>Local-first runtime</small></div></div>
    </aside>
    <section className="content"><header><div><span className="eyebrow">PERSONAL AI WORKSPACE</span><h1>Agent overview</h1><p>Think locally. Learn safely. Stay in control.</p></div><div className="pill"><span className="dot"/> V1.1 · HUMAN-APPROVED</div></header>
      <section className="tokenBar"><KeyRound size={17}/><div className="tokenLabel"><b>API access token</b><small>Only needed when NEXORA_API_TOKEN is configured in .env</small></div><input aria-label="API access token" type={showToken?"text":"password"} placeholder="Optional bearer token" value={token} onChange={e=>setToken(e.target.value)}/><button className="secondaryBtn" onClick={()=>setShowToken(!showToken)}>{showToken?"Hide":"Show"}</button><button className="secondaryBtn" onClick={()=>void refreshSkills()}><RefreshCw size={14}/> Refresh</button></section>
      <div className="stats"><article><span>RUNTIME</span><h2>{health==="online"?"Connected":"Waiting"}</h2><small>127.0.0.1:8000</small></article><article><span>DEFAULT MODE</span><h2>Local-first</h2><small>Cloud fallback off</small></article><article><span>LEARNED SKILLS</span><h2>{skills.length}</h2><small>Approval required</small></article></div>
      <div className="workspace"><section className="panel chat"><div className="panelHead"><div><span className="eyebrow">INTERACTIVE SESSION</span><h3>Talk to Nexora</h3></div><select value={provider} onChange={e=>setProvider(e.target.value)}><option value="local">LiteRT-LM local</option><option value="claude">Claude API</option></select></div><div className="answer"><div className="aiAvatar"><BrainCircuit size={20}/></div><div><b>Nexora</b><p>{answer || (busy?"Thinking…":"")}</p></div></div><div className="composer"><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ask Nexora to reason, plan, or summarize…" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}}/><button onClick={()=>void send()} disabled={busy||!message.trim()}><Send size={17}/>{busy?"Working":"Send"}</button></div><small className="hint">Enter to send · Shift+Enter for a new line · review all skill changes</small></section>
      <section className="panel"><div className="panelHead"><div><span className="eyebrow">CONTROLLED EVOLUTION</span><h3>Skill registry</h3></div><span className="tag">SAFE MODE</span></div>
      <div className="skillForm"><input value={skillName} onChange={e=>setSkillName(e.target.value)} placeholder="Skill name"/><input value={skillDescription} onChange={e=>setSkillDescription(e.target.value)} placeholder="What should it help with?"/><textarea value={skillInstructions} onChange={e=>setSkillInstructions(e.target.value)} placeholder="Instruction-only skill definition; no executable code."/><button onClick={()=>void createSkill()} disabled={skillBusy||!skillName.trim()||!skillDescription.trim()||!skillInstructions.trim()}>{skillBusy?"Saving…":"Propose skill"}</button></div>
      {notice&&<p className="notice" role="status">{notice}</p>}
      {skills.length===0?<div className="empty"><Sparkles size={24}/><b>No learned skills yet</b><p>Create a proposal above. Check it before approving.</p></div>:skills.slice(0,8).map(s=><div className="skill" key={s.id}><div className="skillIcon"><Sparkles size={17}/></div><div className="skillText"><b>{s.name}</b><small>{s.description}</small><small>Version {s.version}</small></div><span className={"status "+s.status}>{s.status}</span><div className="skillActions"><button title="Run static checks" onClick={()=>void skillAction(s.id,"test")}><ShieldCheck size={14}/></button>{s.status!=="approved"&&s.status!=="rolled_back"&&<button title="Approve skill" onClick={()=>void skillAction(s.id,"approve")}><Check size={14}/></button>}{s.status!=="rejected"&&s.status!=="rolled_back"&&<button title="Reject skill" onClick={()=>void skillAction(s.id,"reject")}><X size={14}/></button>}<button title="Rollback status" onClick={()=>void skillAction(s.id,"rollback")}><RotateCcw size={14}/></button></div></div>)}</section></div>
      <footer><ShieldCheck size={15}/> Skills are stored as instructions only. Static checks are not a security sandbox, and approval does not execute generated code.</footer>
    </section>
  </main>;
}
