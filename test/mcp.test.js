import test from "node:test";
import assert from "node:assert/strict";
import { McpClient } from "../src/mcp.js";

const mockServer = String.raw`process.stdin.setEncoding("utf8");
let buffer = "";
process.stdin.on("data", chunk => {
  buffer += chunk;
  const lines = buffer.split("\\n");
  buffer = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    let message;
    try { message = JSON.parse(line); } catch { continue; }
    if (message.id === undefined) continue;
    let result = {};
    if (message.method === "initialize") {
      result = { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "mock", version: "1.0.0" } };
    } else if (message.method === "tools/list") {
      result = { tools: [{ name: "echo", description: "Echo input", inputSchema: { type: "object" } }] };
    } else if (message.method === "tools/call") {
      result = { content: [{ type: "text", text: JSON.stringify(message.params.arguments) }], isError: false };
    }
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }) + "\\n");
  }
});`;

test("MCP client initializes, lists tools, and calls an advertised tool", async () => {
  const client = new McpClient(process.execPath, ["-e", mockServer], { timeout: 3000 });
  try {
    const connected = await client.connect();
    assert.equal(connected.tools[0].name, "echo");
    const result = await client.callTool("echo", { message: "hello" });
    assert.equal(result.content[0].text, '{"message":"hello"}');
  } finally {
    client.close();
  }
});

test("MCP client refuses tools not advertised by the server", async () => {
  const client = new McpClient(process.execPath, ["-e", mockServer], { timeout: 3000 });
  try {
    await client.connect();
    await assert.rejects(() => client.callTool("not-advertised", {}), /not advertised/);
  } finally {
    client.close();
  }
});
