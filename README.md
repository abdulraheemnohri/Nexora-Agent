# Nexora Agent — HTML + CSS + JavaScript

A clean restart of Nexora as a **single-language JavaScript full-stack AI agent**.

- Frontend: HTML + CSS + vanilla JavaScript
- Backend: Node.js JavaScript
- Local storage: JSON
- AI: Claude + detected/validated LiteRT-LM CLI + OpenAI-compatible endpoints
- Gateway: HTTP API
- Agent: bounded tool-use loop with approval and workspace sandbox
- Channels: Telegram/WhatsApp webhook foundations
- No React, TypeScript, Docker, Firebase.

## Start on Debian/Linux

```bash
sudo apt update
sudo apt install -y nodejs npm git
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
cp .env.example .env
npm install
npm start
```

Open `http://127.0.0.1:8787`.

Set `NEXORA_API_TOKEN` and `ANTHROPIC_API_KEY` in `.env`.

## LiteRT-LM

Nexora never invents LiteRT-LM CLI syntax. It runs the configured executable with `--help` for diagnostics. Actual inference is enabled only when you provide the exact command syntax supported by your installed CLI through `NEXORA_LITERT_COMMAND`, using `{prompt}` as the substitution placeholder.

## Project

```
public/       HTML/CSS/JS dashboard
src/          Node.js backend
src/agent.js  autonomous agent loop
src/providers.js Claude/LiteRT/compatible providers
src/tools/    sandboxed tools
data/         local persistent state
```
