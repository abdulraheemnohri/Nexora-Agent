#!/usr/bin/env bash
set -euo pipefail
python -m uvicorn app.api:app --host "${NEXORA_HOST:-127.0.0.1}" --port "${NEXORA_PORT:-8000}" --reload
