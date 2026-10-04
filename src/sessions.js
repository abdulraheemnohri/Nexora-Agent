import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dataFile = () => path.resolve(process.env.NEXORA_DATA || "data", "sessions.json");
const empty = () => ({ schemaVersion: 1, sessions: [] });
function read(file = dataFile()) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) return empty();
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return { ...empty(), ...parsed, sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [] };
  } catch (error) { throw new Error("Cannot read sessions: " + error.message); }
}
function write(db, file = dataFile()) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(tmp, file);
  return db;
}
export function listSessions(file) {
  return read(file).sessions.map(({ id, title, createdAt, updatedAt, messageCount, activeProvider }) => ({ id, title, createdAt, updatedAt, messageCount: messageCount ?? 0, activeProvider: activeProvider ?? null })).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function createSession(title = "New conversation", file) {
  const db = read(file), now = new Date().toISOString();
  const session = { id: crypto.randomUUID(), title: String(title).trim().slice(0,120) || "New conversation", createdAt: now, updatedAt: now, messageCount: 0, activeProvider: null, messages: [] };
  db.sessions.push(session); write(db,file); return session;
}
export function getSession(id, file) {
  return read(file).sessions.find(s => s.id === id || s.id.startsWith(String(id))) ?? null;
}
export function updateSession(id, patch, file) {
  const db = read(file), session = db.sessions.find(s => s.id === id || s.id.startsWith(String(id)));
  if (!session) throw new Error("Session not found");
  Object.assign(session, patch, { updatedAt: new Date().toISOString() }); write(db,file); return session;
}
export function appendMessage(id, role, content, metadata = {}, file) {
  if (!["user","assistant","system"].includes(role)) throw new Error("Invalid message role");
  const db = read(file), session = db.sessions.find(s => s.id === id || s.id.startsWith(String(id)));
  if (!session) throw new Error("Session not found");
  session.messages.push({ id: crypto.randomUUID(), role, content: String(content ?? ""), createdAt: new Date().toISOString(), metadata });
  session.messageCount = session.messages.length;
  if (role === "user" && session.messages.filter(m => m.role === "user").length === 1 && session.title === "New conversation") session.title = String(content).replace(/\s+/g," ").slice(0,72) || session.title;
  session.updatedAt = new Date().toISOString(); write(db,file); return session;
}
export function undoLastTurn(id, file) {
  const db = read(file), session = db.sessions.find(s => s.id === id || s.id.startsWith(String(id)));
  if (!session) throw new Error("Session not found");
  let index = -1;
  for (let i=session.messages.length-1;i>=0;i--) if (session.messages[i].role === "user") { index=i; break; }
  if (index >= 0) session.messages.splice(index);
  session.messageCount = session.messages.length; session.updatedAt = new Date().toISOString(); write(db,file); return session;
}
