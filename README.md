# Nexora Agent V1

A local-first self-growing AI agent for Debian/Linux with a React dashboard, CLI, FastAPI gateway, Anthropic Claude provider, and configurable LiteRT-LM CLI subprocess adapter.

## Safety and scope
- No Docker.
- Local provider is the default; cloud fallback is disabled unless explicitly configured.
- Claude uses your own Anthropic API key, stored in `.env`.
- LiteRT-LM commands are **not guessed**. Configure `NEXORA_LITERT_ARGV_JSON` to match the CLI installed on your system.
- Learned skills are instruction data, not executable code. New skills require tests and explicit approval.
- Bind to localhost by default. Do not expose publicly without authentication and TLS.

## Debian install
```bash
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -e ".[dev]"
cp .env.example .env
```

Edit `.env`. Never commit it.

## Run API and CLI
```bash
source .venv/bin/activate
nexora serve
# another terminal
nexora status
nexora chat "Explain how Nexora works"
```
API docs: http://127.0.0.1:8000/docs

## Run dashboard
```bash
cd frontend
npm install
npm run dev
```

## Claude
Set `NEXORA_ANTHROPIC_API_KEY` and `NEXORA_DEFAULT_PROVIDER=claude`. API calls may incur charges. Never put the key in frontend code.

## LiteRT-LM CLI
1. Inspect the installed CLI using its own `--help`.
2. Set `NEXORA_LITERT_ENABLED=true` and `NEXORA_LITERT_EXECUTABLE`.
3. Set `NEXORA_LITERT_ARGV_JSON` to a JSON array of arguments supported by that installed CLI, including `{prompt}` where prompt text belongs. Optional placeholders: `{model}`, `{system}`.
4. Run `nexora doctor` and test a harmless prompt.
5. The adapter uses subprocess execution without a shell.

No universal LiteRT-LM command or model flag is assumed.

## API endpoints
`GET /health`, `GET /v1/providers`, `GET /v1/models`, `POST /v1/chat/completions`, `POST /v1/agent/run`, task status/list, memory search/create, skill create/list/test/decision/rollback, and audit log endpoints.

## Tests
```bash
pytest -q
```

## Dashboard authentication
If `NEXORA_API_TOKEN` is non-empty in `.env`, enter the same value in the dashboard's API access token field. The dashboard keeps the token only in page memory; it is not persisted to local storage. The health endpoint is intentionally public, while application endpoints require the bearer token.

## V1.1 dashboard updates
- Enter an optional bearer token for protected endpoints.
- Propose instruction-only skills from the dashboard.
- Run static checks, approve/reject, and mark a skill rolled back.
- CI runs the Python test suite and builds the frontend separately.

## Security
Keep secrets, model files, and the SQLite database out of version control. Review skills before approval. Approval never enables generated code execution. Back up the database before upgrades. V1 is not intended for safety-critical autonomous control.

## Roadmap
V1.1: durable task queue, provider health checks, dashboard auth support, structured evaluation sets, and GitHub Actions CI. Later: isolated code experiments with mandatory tests, explicit approval, versioned artifacts, and rollback.
\n## AI providers\nNexora now has a single gateway for local LiteRT-LM plus Claude and configurable cloud providers: OpenAI, Gemini, Groq, OpenRouter, Together, and Mistral. The OpenAI-compatible adapters use each provider's configured base URL and model; keys remain in `.env`. Gemini uses Google's `generateContent` REST interface. citeturn0search0turn0search1\n\nSet `NEXORA_DEFAULT_PROVIDER` to one of the configured provider IDs. Cloud calls are explicit; Nexora does not silently switch away from local inference.\n\n## Messaging channels\n### Telegram\n1. Create a bot with BotFather and set `NEXORA_TELEGRAM_BOT_TOKEN`.\n2. Set `NEXORA_TELEGRAM_ENABLED=true`.\n3. Point Telegram's webhook at `POST /v1/channels/telegram/webhook`.\n4. Nexora receives text messages, sends them through the gateway, and replies with the selected provider.\n\n### WhatsApp Cloud API\nSet `NEXORA_WHATSAPP_ENABLED=true`, `NEXORA_WHATSAPP_ACCESS_TOKEN`, `NEXORA_WHATSAPP_PHONE_NUMBER_ID`, and `NEXORA_WHATSAPP_VERIFY_TOKEN`. Configure Meta's webhook verification against `GET /v1/channels/whatsapp/webhook` and message delivery against `POST /v1/channels/whatsapp/webhook`. Nexora parses inbound text messages and replies through the WhatsApp Cloud API.\n\nKeep webhook endpoints behind HTTPS and a reverse proxy in production. Do not expose the local development server directly to the public Internet.\n
## Mobile system

Nexora now includes an Android companion under `mobile/`. It is designed as an edge client for the Debian/Linux Nexora gateway and provides a Compose UI plus a foreground-service foundation for long-running status/voice work.

The architecture is:

```
Android phone
   ├─ Chat / notifications / voice controls
   └─ future device tools
          │ HTTPS + bearer auth
          ▼
Nexora Gateway on Debian/Linux
   ├─ Agent runtime
   ├─ memory / skills / audit
   ├─ provider router
   └─ LiteRT-LM CLI adapter
          │
          ├─ local LiteRT-LM
          ├─ Claude
          ├─ OpenAI
          ├─ Gemini
          ├─ Groq
          ├─ OpenRouter
          ├─ Together
          └─ Mistral
```

The mobile project is a foundation, not a claim that every Android device-control capability is already implemented. Android's background-service restrictions must be respected, especially for microphone/voice functionality. The platform requires foreground-service handling and appropriate permissions on recent Android versions.

## Hermes-style capability map

`GET /v1/features` exposes the current implementation status of the Nexora capability surface. Active components include memory, skills, API, Telegram, WhatsApp, and the Android foundation. More advanced Hermes-style capabilities—browser automation, delegation, voice, wake word, cron, MCP, terminal/file tools, profiles, and batch evaluation—are explicitly tracked as planned rather than falsely presented as complete.

Nexora is implementing these capabilities independently rather than copying Hermes source code.


## Autonomous agent loop

The agent runtime now implements a bounded, auditable loop:

`model → structured action → policy → tool/approval → observation → model → final`

The model must emit a strict JSON action. Supported V1 tools are:
- `filesystem.read`: automatic, workspace-scoped read.
- `filesystem.write`: pauses for explicit approval.
- `terminal`: pauses for explicit approval and executes only inside the configured workspace.

Every model response, tool request, and tool result is persisted in `task_trace`. Tasks persist their provider, step count, status, result, and pending approval in SQLite.

### Agent task API

- `POST /v1/agent/run` — create and execute an agent task.
- `POST /v1/agent/tasks` — same task runner as an explicit task endpoint.
- `GET /v1/agent/tasks` — list recent tasks.
- `GET /v1/agent/tasks/{id}` — inspect task state.
- `GET /v1/agent/tasks/{id}/trace` — inspect the full execution trace.
- `POST /v1/agent/tasks/{id}/approve` — approve the currently pending tool action.
- `POST /v1/agent/tasks/{id}/cancel` — cancel a task.

The loop is intentionally bounded to eight model/tool steps per continuation. This V1 does not silently approve terminal or filesystem writes, and it does not claim browser, MCP, voice, wake-word, or Android device automation is implemented yet.
