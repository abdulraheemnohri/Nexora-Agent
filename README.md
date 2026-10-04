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

## Security
Keep secrets, model files, and the SQLite database out of version control. Review skills before approval. Approval never enables generated code execution. Back up the database before upgrades. V1 is not intended for safety-critical autonomous control.

## Roadmap
V1.1: durable task queue, provider health checks, dashboard auth support, structured evaluation sets, and GitHub Actions CI. Later: isolated code experiments with mandatory tests, explicit approval, versioned artifacts, and rollback.
