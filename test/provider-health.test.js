import test from "node:test";
import assert from "node:assert/strict";
import { buildProviderHealth } from "../src/provider-health.js";

test("provider health reports configuration without exposing secrets or probing APIs", () => {
  const report = buildProviderHealth({
    dynamicProviders: [
      { id: "local", name: "Local", type: "openai-compatible", enabled: true, baseUrl: "http://127.0.0.1:1234/v1", model: "small", secret: "never-return-this" },
      { id: "disabled", type: "command", enabled: false, command: "my-model {prompt}" },
      { id: "broken", type: "openai-compatible", enabled: true, baseUrl: "" }
    ],
    builtIn: {
      claude: { configured: false },
      litert: { configured: true, installed: true, binary: "litert-lm" },
      smartMini: { name: "Local model" },
      compatible: { configured: true, url: "http://localhost:1234/v1", model: "local" }
    }
  });
  assert.equal(report.mode, "configuration-only");
  assert.equal(report.providers.find(p => p.id === "local").status, "configured");
  assert.equal(report.providers.find(p => p.id === "disabled").status, "disabled");
  assert.equal(report.providers.find(p => p.id === "broken").status, "misconfigured");
  assert.equal(report.providers.find(p => p.id === "litert").status, "ready");
  assert.equal(JSON.stringify(report).includes("never-return-this"), false);
  assert.equal(report.note.includes("Connectivity is not tested"), true);
});

test("provider health handles an empty configuration", () => {
  const report = buildProviderHealth();
  assert.equal(report.summary.total, 3);
  assert.equal(report.summary.ready, 0);
  assert.equal(report.summary.needsAttention, 3);
});
