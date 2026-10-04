import test from "node:test";
import assert from "node:assert/strict";
import { mcpServerSummary } from "../src/mcp-status.js";

test("MCP summary reports connection and tool count without exposing secrets", () => {
  const configured = [
    { name: "docs", command: "node", args: ["server.js"], timeout: 12000, enabled: true },
    { name: "offline", command: "python", args: ["mcp.py"], timeout: 8000, enabled: false }
  ];
  const tools = [
    { name: "mcp:docs:search", server: "docs" },
    { name: "mcp:docs:fetch", server: "docs" }
  ];
  assert.deepEqual(mcpServerSummary(configured, tools), [
    { name: "docs", enabled: true, command: "node", timeout: 12000, connected: true, toolCount: 2 },
    { name: "offline", enabled: false, command: "python", timeout: 8000, connected: false, toolCount: 0 }
  ]);
});
