import { getProvider, generateDynamic } from "./provider-registry.js";

/**
 * Probe an OpenAI-compatible provider without exposing credentials.
 * Requests are bounded by the provider's configured timeout.
 */
export async function discoverProviderModels(id) {
  const p = getProvider(id);
  if (!p || p.enabled === false) throw Error("Provider unavailable: " + id);
  if (p.type !== "openai-compatible") {
    return { provider: id, supported: false, reason: "Model discovery requires an OpenAI-compatible provider." };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(Math.max(Number(p.timeoutMs) || 15000, 1000), 60000));
  try {
    const url = p.baseUrl.replace(/\/$/, "") + "/models";
    const response = await fetch(url, {
      method: "GET",
      headers: p.secret ? { authorization: "Bearer " + p.secret } : {},
      signal: controller.signal,
      redirect: "error"
    });
    if (!response.ok) throw Error("Provider model discovery returned HTTP " + response.status);
    const payload = await response.json();
    const models = Array.isArray(payload.data) ? payload.data.map(x => ({
      id: String(x.id || ""),
      ownedBy: x.owned_by ? String(x.owned_by) : null
    })).filter(x => x.id) : [];
    return { provider: id, supported: true, models };
  } catch (error) {
    if (error.name === "AbortError") throw Error("Provider model discovery timed out");
    throw Error("Provider model discovery failed: " + error.message);
  } finally {
    clearTimeout(timer);
  }
}

export async function testProviderConnection(id, prompt = "Reply with exactly: NEXORA_PROVIDER_OK") {
  const startedAt = Date.now();
  try {
    const result = await generateDynamic(id, prompt);
    return {
      ok: Boolean(result && typeof result.text === "string" && result.text.length),
      provider: id,
      model: result?.model || null,
      latencyMs: Date.now() - startedAt,
      responsePreview: String(result?.text || "").slice(0, 300)
    };
  } catch (error) {
    return {
      ok: false,
      provider: id,
      latencyMs: Date.now() - startedAt,
      error: String(error.message || error).replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]").slice(0, 300)
    };
  }
}
