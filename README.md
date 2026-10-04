# Nexora Agent

Nexora is a terminal-first, cross-platform AI agent built with **HTML + CSS + JavaScript + Node.js**.

## Product scope
**Android app/client is removed.** This repository does not contain or ship an Android application.

Supported targets:
- Linux: Bash, Zsh, Dash and other POSIX shells
- Windows: PowerShell, Windows Terminal and CMD-capable hosts
- macOS
- BSD/Unix-like systems
- Other Node.js-supported environments where the shell adapter is compatible

The browser UI is only a web interface to the Node.js agent.

## Stack
HTML5 + CSS3 + vanilla JavaScript + Node.js. No React, TypeScript, Docker or Firebase.

## v1.2 features
- Persistent JSON state for tasks, memory, skills, schedules and audit records
- Background one-shot scheduler restored after restart
- Memory add/search API
- Skill proposal → explicit approval → rollback lifecycle
- Bounded agent loop with approval-gated terminal/filesystem writes
- Workspace path sandbox
- Cross-platform native shell adapter
- Claude/Anthropic provider
- Local LiteRT-LM CLI adapter
- OpenAI-compatible provider
- Browser dashboard for Chat, Tasks, Providers, Memory, Skills, Schedules and Audit

## Install

Linux/macOS/BSD:
```bash
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
cp .env.example .env
npm install
npm test
npm start
```

Windows PowerShell:
```powershell
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
Copy-Item .env.example .env
npm install
npm test
npm start
```

Open `http://127.0.0.1:8787`.

## Provider configuration

Set `NEXORA_API_TOKEN` for the protected API.

Claude:
```
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5
```

LiteRT-LM:
```
NEXORA_LITERT_BIN=litert
NEXORA_LITERT_COMMAND=
```
Nexora **does not invent LiteRT-LM CLI syntax**. It probes the configured binary with `--help`. Inference is enabled only when you supply the exact command template supported by your installed CLI, using `{prompt}` as the substitution placeholder.

OpenAI-compatible:
```
OPENAI_COMPATIBLE_URL=
OPENAI_COMPATIBLE_API_KEY=
OPENAI_COMPATIBLE_MODEL=
```

## Security
Keep the server on localhost unless remote access is intentionally configured. Use a strong API token. Terminal execution and filesystem writes require explicit task approval. All agent file paths are constrained to the configured workspace.

## API
- `GET /api/health`
- `GET /api/providers`
- `GET /api/state`
- `GET /api/memory?q=...`
- `GET /api/skills`
- `POST /api/chat`
- `POST /api/tasks`
- `POST /api/tasks/:id/approve`
- `POST /api/tasks/:id/cancel`
- `POST /api/memory`
- `POST /api/skills/propose`
- `POST /api/skills/:id/approve`
- `POST /api/skills/:id/rollback`
- `POST /api/schedules`
- `POST /api/schedules/:id/cancel`
- Telegram/WhatsApp webhook foundation endpoints remain present.

## Tests
```bash
npm test
```

Android remains permanently out of product scope for this repository.
