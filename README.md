# Nexora Agent V1

Cross-platform terminal-first AI computer operator built with Node.js + HTML5 + CSS3 + vanilla JavaScript.

## Platform scope
Linux, Windows 10/11, macOS and BSD/Unix-like terminals. No Android application, APK, Kotlin, Jetpack Compose, Docker or Firebase.

## Capability baseline
- Interactive CLI and browser dashboard
- Agent loop with bounded steps and explicit tool actions
- Claude, LiteRT-LM discovery/configuration and OpenAI-compatible provider adapters
- Terminal, filesystem, Git and system tools
- Workspace path containment
- Risk classification and approval policy
- Persistent task, memory, skill and scheduler foundations
- Audit-oriented architecture
- Local-first/offline operation when a local provider is configured
- Extensible channels, MCP, browser, delegation and plugin architecture

## Security principles
External content is untrusted. Tool calls pass through policy. Workspace paths cannot escape the configured workspace. Secrets are not intentionally placed into prompts or logs. Dangerous operations require explicit approval unless the administrator deliberately changes the policy mode.

## LiteRT-LM
Nexora does not invent LiteRT-LM CLI syntax. The installed executable must be discovered and validated with its real help/version interface. Configure NEXORA_LITERT_BIN and NEXORA_LITERT_COMMAND only for a verified local installation.

## Install
Linux/macOS/BSD:
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
cp .env.example .env
npm install
npm test
npm start

Windows PowerShell:
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
Copy-Item .env.example .env
npm install
npm test
npm start

## CLI
nexora status
nexora providers
nexora platform
nexora chat "hello"
nexora task "inspect my workspace"
nexora approve <task-id>
nexora cancel <task-id>

## Development rule
Every new capability must remain observable, permission-aware and rollbackable. The agent may propose reusable skills or improvements, but it must not silently rewrite its own security boundary.

