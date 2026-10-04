#!/data/data/com.termux/files/usr/bin/bash
set -eu
if command -v termux-wake-lock >/dev/null 2>&1; then termux-wake-lock; echo "Nexora Termux wake lock requested."; else echo "termux-wake-lock is optional and unavailable."; fi
