# Nexora Agent on Termux

Termux is supported as a terminal deployment environment, not as an Android application.

## Install
```bash
git clone https://github.com/abdulraheemnohri/Nexora-Agent.git
cd Nexora-Agent
git checkout nexora-v1-complete
bash scripts/install-termux.sh
source ~/.bashrc
nexora doctor
```

## Run
```bash
nexora
nexora chat "hello"
nexora status
nexora platform
bash scripts/start-termux.sh
```

Nexora uses the normal Termux userspace. No APK, Kotlin project, Jetpack Compose UI, root requirement, hidden Android service, or Docker dependency is introduced.

Android may suspend Termux processes because of battery/power policies. Nexora does not silently create persistence.

Local AI runtimes are adapter-based. LiteRT-LM commands are never invented; the installed executable/interface must be detected and validated.

Default data is stored in `data/` and `workspace/`. Keep secrets out of prompts, memory, logs, and Git.
