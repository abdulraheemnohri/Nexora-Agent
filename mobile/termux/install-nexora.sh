#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
echo "== Nexora Android / Termux installer =="
command -v pkg >/dev/null || { echo "Run this inside Termux."; exit 1; }
pkg update -y
pkg install -y python git clang make
PREFIX_DIR="$HOME/.nexora"
REPO_DIR="$PREFIX_DIR/Nexora-Agent"
mkdir -p "$PREFIX_DIR"
if [ -d "$REPO_DIR/.git" ]; then git -C "$REPO_DIR" pull --ff-only; else git clone https://github.com/abdulraheemnohri/Nexora-Agent.git "$REPO_DIR"; fi
cd "$REPO_DIR"
python -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
echo "Installed: $REPO_DIR"
echo "Run: source $REPO_DIR/.venv/bin/activate"
echo "Then: nexora status"