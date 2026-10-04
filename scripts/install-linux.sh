#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$HOME/.local/bin"; ln -sf "$ROOT/bin/nexora.js" "$HOME/.local/bin/nexora"; chmod +x "$ROOT/bin/nexora.js"
echo "Nexora CLI installed. Add ~/.local/bin to PATH if needed."
