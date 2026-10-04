import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appendMessage, createSession, getSession, listSessions, undoLastTurn } from "../src/sessions.js";

test("sessions persist, list, and switch by id prefix", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nexora-sessions-"));
  const file = path.join(dir, "sessions.json");
  const session = createSession("Test conversation", file);
  appendMessage(session.id, "user", "hello", {}, file);
  appendMessage(session.id, "assistant", "hi", {}, file);
  assert.equal(getSession(session.id.slice(0, 8), file).id, session.id);
  assert.equal(listSessions(file)[0].messageCount, 2);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("undoLastTurn removes the latest user message and its reply", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nexora-sessions-"));
  const file = path.join(dir, "sessions.json");
  const session = createSession("Undo test", file);
  appendMessage(session.id, "user", "first", {}, file);
  appendMessage(session.id, "assistant", "answer", {}, file);
  appendMessage(session.id, "user", "second", {}, file);
  appendMessage(session.id, "assistant", "answer 2", {}, file);
  const updated = undoLastTurn(session.id, file);
  assert.deepEqual(updated.messages.map(m => m.content), ["first", "answer"]);
  fs.rmSync(dir, { recursive: true, force: true });
});
