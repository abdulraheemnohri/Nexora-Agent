# Nexora Termux Runtime

Termux is a first-class terminal runtime, not an Android application. Nexora never installs an APK, Android UI, hidden Android service, or root component.

Supports Node.js CLI/gateway, Bash/sh execution through policy, Git, workspace sandbox, persistent data, configured AI providers, and detected local runtimes. LiteRT syntax is never invented: Nexora validates the real executable interface before use.

Optional user-controlled lifecycle scripts provide wake-lock request/release. Nexora does not silently create Android persistence and the OS may suspend Termux processes.

All shell actions remain behind policy and approval. Secrets must never enter prompts, memory, logs, or Git.