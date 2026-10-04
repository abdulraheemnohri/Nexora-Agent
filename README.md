# Nexora Agent v1.3

Cross-platform terminal-first AI agent built with HTML/CSS/JavaScript + Node.js.

Android app/client is removed and out of scope.

## v1.3
- Persistent memory and skill lifecycle
- Background worker and scheduler restoration
- Cross-platform CLI
- Linux and Windows CLI installers
- Claude, LiteRT-LM CLI and OpenAI-compatible providers
- Approval-gated terminal/filesystem actions
- Local JSON state and audit log
- Browser dashboard

## Install

Linux/macOS/BSD:
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
cp .env.example .env
npm install
npm test
chmod +x bin/nexora.js scripts/*.sh
./scripts/install-linux.sh
nexora status
npm start

Windows PowerShell:
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
Copy-Item .env.example .env
npm install
npm test
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\install-windows.ps1
node .\bin\nexora.js status
npm start

## CLI

nexora status
nexora providers
nexora platform
nexora chat "hello"
nexora task "inspect my workspace"
nexora approve <task-id>
nexora cancel <task-id>
nexora logs

## Worker

Linux/macOS/BSD: ./scripts/start-worker.sh
Windows: .\scripts\start-worker.ps1

The worker is foreground by design. Use systemd, Task Scheduler, NSSM or the host OS service manager when you intentionally want a persistent service.

## LiteRT-LM

Nexora probes NEXORA_LITERT_BIN --help and never invents LiteRT-LM CLI syntax. Set NEXORA_LITERT_COMMAND only after validating the exact installed interface, using {prompt} as the prompt placeholder.

## Security

Bind to localhost by default. Set a strong NEXORA_API_TOKEN. Terminal and filesystem writes remain approval-gated.

No Android application is included.


## v1.4 Hermes-inspired capability layer

Nexora now includes an original Hermes-inspired capability model. It is **not a copy of Hermes source code**. The goal is feature parity at the architecture/tooling level while keeping Nexora's Node.js + HTML/CSS/JavaScript, local-first, no-Docker, cross-platform design.

### Added feature families

- **Toolsets:** web/search, terminal/process, file editing, browser/CDP, vision/computer-use, image generation, TTS, skills, todo, memory/session search, cron, code execution, delegation, clarification, messaging, Home Assistant, Discord, Spotify, video, MCP, project/debugging, safety/audit.
- **Persistent memory:** durable facts, session search, memory write/delete controls and approval mode.
- **Progressive skills:** list/view/manage, versioning, platform gates, external skill directories, skill-write approval, reusable procedures.
- **Subagents:** isolated context, configurable concurrency/depth, parallel task execution and result aggregation.
- **Code execution:** controlled programmatic tool execution with policy/approval boundaries.
- **Browser:** Chromium-family CDP integration point, navigation/snapshot/action lifecycle, upload/download and tab management.
- **Web/media:** web search/extraction, X-search provider hook, vision, image generation, TTS and video tool hooks.
- **Automation:** persistent cron/scheduler, todo plans, background processes and batch processing.
- **MCP:** dynamic external tool-server registry through the same policy engine.
- **Profiles/personality:** SOUL.md identity, presets, skins/themes and per-session toolsets.
- **Messaging:** channel adapters for Telegram/WhatsApp plus architecture for Discord, Slack, Signal, email and Teams.
- **Plugins/hooks:** plugin directory, lifecycle hooks, tool interception and metrics/guardrails.
- **API:** OpenAI-compatible gateway direction plus Nexora REST/SSE endpoints.
- **Safety:** approval gateway, risk classification, audit trail, workspace sandbox, rate limits and rollback.
- **Offline-first:** local LiteRT-LM remains the preferred offline provider; cloud providers are optional.

### New API discovery endpoints

- GET `/api/features`
- GET `/api/tools`
- GET `/api/toolsets`
- GET `/api/config`

### Configuration

The new `config.json` schema controls agent limits, approvals, terminal backend, enabled toolsets, browser CDP, memory, skills, scheduler, delegation, channels, API, UI skin, personality, plugins, hooks, batch processing and telemetry. Environment variables remain the secure source for secrets.

### Important platform rule

Nexora remains **terminal/web based only**. There is **no Android application, APK, Android UI, or Android source tree**. Linux, Windows, macOS and BSD/Unix-like terminals remain the supported deployment model.
