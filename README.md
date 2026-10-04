# Nexora Agent

Nexora is a terminal-first, cross-platform local AI agent built with **HTML + CSS + JavaScript + Node.js**.

## Product scope
**Android app/client has been removed.** This repository does not contain or ship an Android application.

Nexora runs on Node.js-capable desktop/server environments:
- Linux terminals: Bash, Zsh, Dash and other POSIX shells
- Windows: PowerShell, Windows Terminal and CMD-capable Windows hosts
- macOS
- BSD/Unix-like systems
- Other Node.js-supported OS targets can use the same adapter where their shell is compatible

The web UI remains a browser interface to the local Node.js agent; it is not a separate Android app.

## Stack
HTML5 + CSS3 + vanilla JavaScript + Node.js. No React, TypeScript, Docker or Firebase.

## Install
Linux/macOS/BSD:
```bash
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
cp .env.example .env
npm install
npm start
```

Windows PowerShell:
```powershell
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
Copy-Item .env.example .env
npm install
npm start
```

Open `http://127.0.0.1:8787`.

## Cross-platform terminal engine
Nexora detects `process.platform` at runtime:
- Windows defaults to PowerShell
- POSIX systems default to the user's `SHELL`, then `/bin/sh`

Optional overrides:
`NEXORA_WINDOWS_SHELL` and `NEXORA_POSIX_SHELL`.

Terminal commands and filesystem writes are **approval-gated**. Commands execute with the Nexora workspace as their working directory.

## Providers
Claude/Anthropic, LiteRT-LM CLI and OpenAI-compatible endpoints are supported. LiteRT-LM syntax is never guessed: Nexora probes the configured binary with `--help` and requires an explicit `NEXORA_LITERT_COMMAND` template using `{prompt}`.

## Security
Keep the server on localhost unless remote access is intentionally configured. Set a strong `NEXORA_API_TOKEN`. Do not expose an unrestricted terminal endpoint to the public internet.

## Tests
```bash
npm test
```

## Roadmap
V1 cross-platform terminal core → background jobs/scheduler → richer skills/memory → Telegram/WhatsApp adapters → browser/MCP integrations. Android app remains out of scope.
