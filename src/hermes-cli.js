import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { loadState, saveState } from "./store.js";
import { Agent } from "./agent.js";
import { TaskQueue } from "./task-queue.js";
import { Scheduler } from "./scheduler.js";
import { doctor } from "./doctor.js";
import { detectPlatform } from "./platforms.js";
import { listProviders, providerStatus, useProvider } from "./provider-registry.js";
import { Skills } from "./skills.js";
import { listSessions, createSession, getSession, appendMessage, undoLastTurn, updateSession } from "./sessions.js";

const help = "Hermes-compatible CLI (Node.js + HTML)\n" +
  "  /new [title]       Start a fresh conversation\n" +
  "  /sessions          List saved conversations\n" +
  "  /switch <id>       Switch to a saved conversation\n" +
  "  /history           Show current conversation history\n" +
  "  /undo              Remove last turn from history (does not undo tools)\n" +
  "  /retry             Re-run the last user message\n" +
  "  /model [provider]  List or select a configured provider\n" +
  "  /skills            List skills and approval status\n" +
  "  /memory            Show saved memory entries\n" +
  "  /status            Show runtime status\n" +
  "  /doctor            Run environment diagnostics\n" +
  "  /usage             Show local conversation counts\n" +
  "  /help              Show this help\n" +
  "  /exit              Quit\n" +
  "Anything else is sent to the selected AI provider.";
const print = value => console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
function makeRuntime(state) {
  const config = { workspace: process.env.NEXORA_WORKSPACE, maxAgentSteps: Number(process.env.NEXORA_MAX_AGENT_STEPS || 20), security: { approvalMode: process.env.NEXORA_APPROVAL_MODE || "ask" } };
  const agent = new Agent(state, saveState, config);
  const queue = new TaskQueue(agent, { concurrency: Number(process.env.NEXORA_MAX_CONCURRENT_TASKS || 2), maxRetries: Number(process.env.NEXORA_MAX_RETRIES || 3) });
  agent.setQueue(queue); queue.restore();
  const scheduler = new Scheduler(state, saveState, queue); scheduler.restore();
  return { agent, queue, scheduler };
}
export async function startInteractive() {
  const state = await loadState(); const { agent } = makeRuntime(state);
  const rl = createInterface({ input: stdin, output: stdout, terminal: Boolean(stdin.isTTY) });
  let session = createSession();
  console.log("Hermes-compatible Nexora · Node.js + HTML");
  console.log("Type /help for commands; /exit to quit.");
  console.log("Platform: " + detectPlatform() + " · Workspace: " + (process.env.NEXORA_WORKSPACE || "./workspace"));
  try {
    while (true) {
      let line; try { line = await rl.question("hermes> "); } catch { break; }
      const input = line.trim(); if (!input) continue;
      if (!input.startsWith("/")) {
        appendMessage(session.id, "user", input);
        try {
          const result = await agent.run(input, session.activeProvider || null);
          const answer = result.result ?? result.error ?? (result.status === "awaiting_approval" ? "Approval required. Task ID: " + result.id + ". Approve with: hermes approve " + result.id : JSON.stringify(result, null, 2));
          appendMessage(session.id, "assistant", answer, { taskId: result.id, status: result.status, provider: result.provider }); console.log("\n" + answer + "\n");
        } catch (error) { appendMessage(session.id, "assistant", "Error: " + error.message, { error: true }); console.error("Error:", error.message); }
        continue;
      }
      const [command, ...parts] = input.slice(1).split(/\s+/); const arg = parts.join(" ");
      try {
        if (command === "exit" || command === "quit") break;
        if (command === "help") console.log(help);
        else if (command === "new") { session = createSession(arg || "New conversation"); console.log("Started session " + session.id.slice(0,8)); }
        else if (command === "sessions") console.log(JSON.stringify(listSessions().map(s => ({ ...s, id: s.id.slice(0,8) })), null, 2));
        else if (command === "switch") { const found = getSession(parts[0] || ""); if (!found) throw new Error("Session not found; use /sessions"); session = found; console.log("Switched to: " + session.title); }
        else if (command === "history") print(session.messages.map(m => ({ role: m.role, at: m.createdAt, content: m.content })));
        else if (command === "undo") { undoLastTurn(session.id); session = getSession(session.id); console.log("Last turn removed from saved history. Already-executed external actions are not reversed."); }
        else if (command === "retry") { const last = [...session.messages].reverse().find(m => m.role === "user"); if (!last) throw new Error("No previous user message"); const result = await agent.run(last.content, session.activeProvider || null); const answer = result.result ?? result.error ?? JSON.stringify(result, null, 2); appendMessage(session.id, "assistant", answer, { taskId: result.id, status: result.status, retry: true }); console.log(answer); }
        else if (command === "model") { if (!arg) print({ providers: await providerStatus(), configured: listProviders(), active: session.activeProvider || "environment default" }); else { const selected = useProvider(parts[0]); session = updateSession(session.id, { activeProvider: selected.id || parts[0] }); console.log("Provider selected: " + (selected.id || parts[0])); } }
        else if (command === "skills") print(new Skills(state, saveState).list());
        else if (command === "memory") print(state.memory || []);
        else if (command === "status") print({ platform: detectPlatform(), session: session.id, provider: session.activeProvider || "environment default", tasks: state.tasks.length, queue: agent.queueRef?.snapshot?.(), memory: state.memory.length, skills: state.skills.length });
        else if (command === "doctor") print(await doctor(process.cwd()));
        else if (command === "usage") print({ sessionMessages: session.messages.length, userMessages: session.messages.filter(m => m.role === "user").length, assistantMessages: session.messages.filter(m => m.role === "assistant").length, totalSavedSessions: listSessions().length });
        else throw new Error("Unknown command. Use /help.");
      } catch (error) { console.error("Command error:", error.message); }
    }
  } finally { rl.close(); }
}
