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
