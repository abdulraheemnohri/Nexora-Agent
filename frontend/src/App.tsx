import { useEffect, useState } from "react";
import { Activity, BrainCircuit, Cpu, Send, ShieldCheck, Sparkles } from "lucide-react";

const API = "http://127.0.0.1:8000";
type Skill = {id:number;name:string;description:string;status:string;version:number};
export default function App() {
  const [message,setMessage] = useState("");
  const [answer,setAnswer] = useState("Nexora is ready. Start the API, then send a message.");
  const [provider,setProvider] = useState("local");
  const [busy,setBusy] = useState(false);
  const [health,setHealth] = useState("checking");
  const [skills,setSkills] = useState<Skill[]>([]);
  useEffect(()=>{fetch(API+"/health").then(r=>r.json()).then(()=>setHealth("online")).catch(()=>setHealth("offline"));fetch(API+"/v1/skills").then(r=>r.json()).then(setSkills).catch(()=>setSkills([]));},[]);
  async function send() {
    if (!message.trim() || busy) return;
    setBusy(true); setAnswer("");
    try { const r=await fetch(API+"/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,provider})}); const data=await r.json(); if(!r.ok) throw new Error(data.detail||"Request failed"); setAnswer(data.response); }
    catch(e) { setAnswer(e instanceof Error ? e.message : "Unable to connect. Start the Nexora API."); }
    finally { setBusy(false); }
  }
  return <main className="shell">
    <aside className="sidebar"><div className="brand"><div className="brandIcon"><BrainCircuit size={24}/></div><div><b>NEXORA</b><small>SELF-GROWING AGENT</small></div></div>
      <div className="nav active"><Activity size={18}/> Overview</div><div className="nav"><Cpu size={18}/> Model gateway</div><div className="nav"><Sparkles size={18}/> Skill learning</div><div className="nav"><ShieldCheck size={18}/> Safety & audit</div>
      <div className="sideStatus"><span className={health==="online"?"dot":"dot muted"}/><div><b>Gateway {health}</b><small>Local-first runtime</small></div></div>
    </aside>
    <section className="content"><header><div><span className="eyebrow">PERSONAL AI WORKSPACE</span><h1>Agent overview</h1><p>Think locally. Learn safely. Stay in control.</p></div><div className="pill"><span className="dot"/> V1 · HUMAN-APPROVED</div></header>
      <div className="stats"><article><span>RUNTIME</span><h2>{health==="online"?"Connected":"Waiting"}</h2><small>127.0.0.1:8000</small></article><article><span>DEFAULT MODE</span><h2>Local-first</h2><small>Cloud fallback off</small></article><article><span>LEARNED SKILLS</span><h2>{skills.length}</h2><small>Approval required</small></article></div>
      <div className="workspace"><section className="panel chat"><div className="panelHead"><div><span className="eyebrow">INTERACTIVE SESSION</span><h3>Talk to Nexora</h3></div><select value={provider} onChange={e=>setProvider(e.target.value)}><option value="local">LiteRT-LM local</option><option value="claude">Claude API</option></select></div><div className="answer"><div className="aiAvatar"><BrainCircuit size={20}/></div><div><b>Nexora</b><p>{answer || (busy?"Thinking…":"")}</p></div></div><div className="composer"><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Ask Nexora to reason, plan, or summarize…" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}}/><button onClick={()=>void send()} disabled={busy||!message.trim()}><Send size={17}/>{busy?"Working":"Send"}</button></div><small className="hint">Enter to send · Shift+Enter for a new line · review all skill changes</small></section>
      <section className="panel"><div className="panelHead"><div><span className="eyebrow">CONTROLLED EVOLUTION</span><h3>Skill registry</h3></div><span className="tag">SAFE MODE</span></div>{skills.length===0?<div className="empty"><Sparkles size={24}/><b>No learned skills yet</b><p>Proposed skills will appear here after the API is configured.</p></div>:skills.slice(0,6).map(s=><div className="skill" key={s.id}><div className="skillIcon"><Sparkles size={17}/></div><div><b>{s.name}</b><small>{s.description}</small></div><span className={"status "+s.status}>{s.status}</span></div>)}</section></div>
      <footer><ShieldCheck size={15}/> No generated code is executed automatically. Skill approval remains a human decision.</footer>
    </section>
  </main>;
}
