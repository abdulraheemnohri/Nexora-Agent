export function mcpServerSummary(configured = [], connectedTools = []) {
  const toolsByServer = new Map();
  for (const tool of connectedTools) {
    const name = String(tool.server || "");
    if (!name) continue;
    toolsByServer.set(name, (toolsByServer.get(name) || 0) + 1);
  }
  return configured.map(server => ({
    name: server.name,
    enabled: server.enabled !== false,
    command: server.command,
    timeout: server.timeout,
    connected: toolsByServer.has(server.name),
    toolCount: toolsByServer.get(server.name) || 0
  }));
}
