#!/usr/bin/env node
import { startInteractive } from "../src/hermes-cli.js";
import { main } from "../src/cli.js";
import { listProviders, providerStatus, useProvider } from "../src/provider-registry.js";

const argv = process.argv.slice(2);
try {
  if (!argv.length) await startInteractive();
  else if (argv[0] === "model") {
    if (!argv[1] || argv[1] === "list") console.log(JSON.stringify({ providers: await providerStatus(), configured: listProviders() }, null, 2));
    else if (argv[1] === "use" && argv[2]) console.log(JSON.stringify(useProvider(argv[2]), null, 2));
    else console.error("Usage: hermes model [list|use <provider-id>]");
  } else if (argv[0] === "setup") {
    console.log("Hermes-compatible setup");
    console.log("1. Copy .env.example to .env");
    console.log("2. Configure a provider key or local endpoint in .env");
    console.log("3. Run: hermes doctor");
    console.log("4. Start: hermes");
    console.log("Secrets are not collected or stored by this setup helper.");
  } else await main(argv);
} catch (error) {
  console.error("Hermes error:", error.message);
  process.exitCode = 1;
}
