/**
 * Configuration-only provider diagnostics. This endpoint never sends prompts,
 * spends API credits, or exposes provider secrets.
 */
export function buildProviderHealth({ dynamicProviders = [], builtIn = {} } = {}) {
  const items = [];
  for (const p of dynamicProviders) {
    const configured = p.type === "command" ? Boolean(p.command) : Boolean(p.baseUrl);
    const status = p.enabled === false ? "disabled" : configured ? "configured" : "misconfigured";
    items.push({
      id: String(p.id || "unknown"),
      name: String(p.name || p.id || "Provider"),
      type: String(p.type || "unknown"),
      status,
      enabled: p.enabled !== false,
      configured,
      model: p.model || null,
      timeoutMs: Number(p.timeoutMs) || null,
      check: "configuration-only"
    });
  }

  const claude = builtIn.claude || {};
  items.push({
    id: "claude", name: "Claude", type: "anthropic",
    status: claude.configured ? "configured" : "needs-configuration",
    enabled: true, configured: Boolean(claude.configured),
    model: claude.model || null, check: "configuration-only"
  });

  const litert = builtIn.litert || {};
  items.push({
    id: "litert", name: "LiteRT-LM", type: "local-command",
    status: litert.installed ? "ready" : "needs-installation",
    enabled: true, configured: Boolean(litert.configured),
    installed: Boolean(litert.installed), binary: litert.binary || null,
    model: builtIn.smartMini?.name || null, check: "local-binary-check"
  });

  const compatible = builtIn.compatible || {};
  items.push({
    id: "compatible", name: "OpenAI-compatible", type: "openai-compatible",
    status: compatible.configured ? "configured" : "needs-configuration",
    enabled: true, configured: Boolean(compatible.configured),
    model: compatible.model || null, url: compatible.url || null,
    check: "configuration-only"
  });

  const ready = items.filter(x => x.status === "ready" || x.status === "configured").length;
  return {
    generatedAt: new Date().toISOString(),
    mode: "configuration-only",
    note: "Connectivity is not tested. Use the explicit provider Test action to send a prompt.",
    summary: { total: items.length, ready, needsAttention: items.length - ready },
    providers: items
  };
}
