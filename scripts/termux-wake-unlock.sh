#!/data/data/com.termux/files/usr/bin/bash
set -eu
if command -v termux-wake-unlock >/dev/null 2>&1; then termux-wake-unlock; fi
echo "Nexora Termux wake lock released."
