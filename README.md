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

## Approved skill execution

Skills in the Skills Hub remain proposals until explicitly approved. Active skills expose a **Run skill** action that accepts a user task and queues it through the normal Nexora agent/tool policy pipeline. Skill instructions are bounded in size, logged with the skill ID and version, and do not bypass the normal tool-approval policy. Disable or roll back a skill to prevent future runs.

## npm package manager

npm is the package manager for JavaScript and is included with Node.js. It helps developers install, manage, share and reuse project packages. Nexora exposes an **npm Packages** dashboard page that reports the detected npm version, Node.js version, declared dependencies, project scripts, and whether `node_modules` and `package-lock.json` exist.

Run commands from the repository root:

```sh
npm install       # install project dependencies
npm run check     # check core JavaScript entry points
npm test          # run automated tests
npm start         # start the Nexora API and web dashboard
npm run worker    # run the optional background worker
```

The dashboard only reports package information and provides command snippets; it does not install or update packages automatically. Review dependency changes before running installation commands.

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

