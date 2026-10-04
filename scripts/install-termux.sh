#!/data/data/com.termux/files/usr/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "Nexora Agent — Termux installer"
command -v pkg >/dev/null || { echo "ERROR: Termux environment required."; exit 1; }
pkg update -y
pkg install -y nodejs git bash
cd "$ROOT"
[ -f package.json ] || { echo "ERROR: run from Nexora repository."; exit 1; }
npm install
mkdir -p "$HOME/.local/bin"
cat > "$HOME/.local/bin/nexora" <<EOF
#!/data/data/com.termux/files/usr/bin/bash
cd "$ROOT"
exec node "$ROOT/bin/nexora.js" "$@"
EOF
chmod +x "$HOME/.local/bin/nexora"
case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc";; esac
echo "Installed. Run: source ~/.bashrc && nexora doctor"
