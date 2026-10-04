# Nexora Mobile

Nexora Mobile is an Android edge console for a Nexora Agent runtime. It is intentionally split into two layers:

- **APK:** gateway configuration, agent UI, device-control surface, and Termux handoff.
- **Termux:** the actual Linux-like terminal runtime used to install/run the Python Nexora agent on Android.

A normal Android APK is sandboxed and is not a general Linux distribution. This project therefore does not fake a shell by running arbitrary commands inside the APK. Termux provides the terminal environment, while Termux:API can expose selected Android functions to command-line programs. citeturn0search10

## Install Nexora on Android

1. Install a current Termux build from a trusted source.
2. Open Termux.
3. Run:

```bash
curl -fsSL https://raw.githubusercontent.com/abdulraheemnohri/Nexora-Agent/main/mobile/termux/install-nexora.sh | bash
```

4. Activate:

```bash
source ~/.nexora/Nexora-Agent/.venv/bin/activate
```

5. Check:

```bash
nexora status
```

The installer uses Termux's package manager, Python virtual environment, and Git. It does not use Docker or a proot Linux distribution.

## Mobile architecture

```
Nexora Mobile APK
      │
      ├── Agent UI
      ├── Gateway URL + bearer token
      ├── Device controls (explicit approval)
      └── Termux handoff
              │
              ▼
       Termux Linux runtime
              │
              ▼
        Nexora Agent CLI
              │
              ▼
       Nexora Gateway / models
```

## Device automation

For screen inspection and user-authorized interaction, Nexora can later use Android's Accessibility Service framework. Android documents this as a specialized background service for inspecting screen content and interacting with apps on the user's behalf; it requires explicit platform configuration and authorization. citeturn0search14

## Hermes-style roadmap

Hermes currently documents persistent memory, skills, terminal/file tools, browser automation, scheduled tasks, delegation, voice, MCP, messaging, checkpoints, and related toolsets. citeturn0search0turn0search1

Nexora's implementation roadmap is:

1. **Core agent:** gateway, memory, skills, checkpoints, provider router.
2. **Tools:** terminal, file operations, web search/extraction, browser, vision, code execution.
3. **Automation:** cron/scheduled tasks, background workers, task queues, retries.
4. **Multi-agent:** isolated sub-agents and explicit tool/permission profiles.
5. **Channels:** Telegram, WhatsApp, then additional adapters.
6. **Mobile:** Termux runtime, notifications, voice, device tools, optional Accessibility Service.
7. **MCP:** allowlisted MCP servers and tool discovery.
8. **Evaluation:** batch runs, traces, regression datasets, and rollback.
9. **Self-growth:** memory distillation → skill proposal → tests → human approval → versioned skill → measured reuse.

Nexora is implementing these capabilities independently rather than copying Hermes source code.
