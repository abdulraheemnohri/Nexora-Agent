#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT"
[[ "$(id -u)" -ne 0 ]] || { echo "Run as a normal user, not root."; exit 1; }
for c in node npm openssl sudo; do command -v "$c" >/dev/null || { echo "Missing command: $c"; exit 1; }; done
MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"; (( MAJOR >= 20 )) || { echo "Node.js 20+ required."; exit 1; }
npm install; mkdir -p data certs logs workspace; chmod 700 data certs logs
LANIP="$(hostname -I 2>/dev/null | awk '{print $1}')"; SAN="DNS:nexora-ai.local,DNS:localhost,IP:127.0.0.1"
if [[ -n "$LANIP" ]]; then SAN="$SAN,IP:$LANIP"; fi
if [[ ! -f certs/server.key || ! -f certs/server.crt ]]; then openssl req -x509 -newkey rsa:3072 -sha256 -nodes -days 825 -keyout certs/server.key -out certs/server.crt -subj "/CN=NEXORA-AI-ONE" -addext "subjectAltName=$SAN"; chmod 600 certs/server.key; chmod 644 certs/server.crt; fi
if [[ ! -f .env.lan ]]; then
 read -rsp "Set a strong LAN password (minimum 16 characters): " PW; echo; N="$(printf %s "$PW" | wc -c)"; (( N >= 16 )) || { echo "Password too short."; exit 1; }
 read -rsp "Confirm password: " PW2; echo; [[ "$PW" == "$PW2" ]] || { echo "Passwords do not match."; exit 1; }
 PB64="$(printf %s "$PW" | base64 | tr -d '\n')"; TOKEN="$(openssl rand -hex 32)"
 cat > .env.lan <<EOF
HOST=127.0.0.1
PORT=8787
NEXORA_HOST=127.0.0.1
NEXORA_PORT=8787
NEXORA_API_TOKEN=$TOKEN
NEXORA_LAN_HOST=0.0.0.0
NEXORA_LAN_PORT=8443
NEXORA_BACKEND_HOST=127.0.0.1
NEXORA_BACKEND_PORT=8787
NEXORA_LAN_PASSWORD_B64=$PB64
NEXORA_TLS_CERT=$ROOT/certs/server.crt
NEXORA_TLS_KEY=$ROOT/certs/server.key
NEXORA_SESSION_TTL_MINUTES=720
EOF
 chmod 600 .env.lan; unset PW PW2 PB64 TOKEN
else echo "Keeping existing .env.lan."; fi
U="$(id -un)"; G="$(id -gn)"; NODE="$(command -v node)"
sudo tee /etc/systemd/system/nexora-backend.service >/dev/null <<EOF
[Unit]
Description=NEXORA AI ONE local backend
After=network.target
[Service]
Type=simple
User=$U
Group=$G
WorkingDirectory=$ROOT
EnvironmentFile=$ROOT/.env.lan
ExecStart=$NODE $ROOT/server.js
Restart=on-failure
RestartSec=4
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=$ROOT/data $ROOT/workspace $ROOT/logs
UMask=0077
[Install]
WantedBy=multi-user.target
EOF
sudo tee /etc/systemd/system/nexora-lan-gateway.service >/dev/null <<EOF
[Unit]
Description=NEXORA AI ONE HTTPS gateway
After=network-online.target nexora-backend.service
Wants=network-online.target
Requires=nexora-backend.service
[Service]
Type=simple
User=$U
Group=$G
WorkingDirectory=$ROOT
EnvironmentFile=$ROOT/.env.lan
ExecStart=$NODE $ROOT/src/lan-gateway.js
Restart=on-failure
RestartSec=4
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only
ReadWritePaths=$ROOT/data $ROOT/logs
UMask=0077
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload; sudo systemctl enable --now nexora-backend.service nexora-lan-gateway.service
if command -v ufw >/dev/null && sudo ufw status | grep -q "Status: active"; then echo "UFW active. Allow your LAN only, e.g. sudo ufw allow from 192.168.1.0/24 to any port 8443 proto tcp"; else echo "Configure firewall to allow TCP 8443 only from trusted LAN/VPN ranges."; fi
echo "NEXORA enabled at boot. Open https://${LANIP:-SERVER-LAN-IP}:8443"
echo "Backend loopback: 127.0.0.1:8787. Do not router-port-forward 8443."
echo "Logs: sudo journalctl -u nexora-backend -u nexora-lan-gateway -f"
