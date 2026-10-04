#!/usr/bin/env bash
set -euo pipefail
MODEL_REPO="${NEXORA_LITERT_MODEL_REPO:-litert-community/gemma-4-E2B-it-litert-lm}"
MODEL_FILE="${NEXORA_LITERT_MODEL_FILE:-gemma-4-E2B-it.litertlm}"
echo "Nexora LiteRT-LM installer"
if command -v uv >/dev/null 2>&1; then
  uv tool install --upgrade litert-lm
elif command -v python3 >/dev/null 2>&1; then
  python3 -m pip install --user --upgrade litert-lm
elif command -v python >/dev/null 2>&1; then
  python -m pip install --user --upgrade litert-lm
else
  echo "ERROR: install uv or Python 3 first." >&2; exit 1
fi
command -v litert-lm >/dev/null 2>&1 || { echo "LiteRT-LM installed but litert-lm is not on PATH."; exit 2; }
litert-lm --help >/dev/null
echo "LiteRT-LM CLI installed."
echo "Smart Mini model: $MODEL_REPO / $MODEL_FILE"
echo "The model is downloaded on first run; no model download is performed by this installer."
echo "Test with: litert-lm run --from-huggingface-repo=$MODEL_REPO $MODEL_FILE --prompt 'Hello'"
