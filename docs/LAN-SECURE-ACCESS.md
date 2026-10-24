# NEXORA AI ONE: Secure LAN Gateway

The HTTPS gateway fronts the existing Nexora Agent. The agent backend listens only on loopback (127.0.0.1:8787); clients use HTTPS on port 8443 and create a per-device session.

## Security
- Password login; secret is stored in .env.lan with mode 0600.
- Random session tokens; only SHA-256 hashes are persisted.
- Secure, HttpOnly, SameSite=Strict cookie; default 12-hour sessions.
- List and revoke individual sessions at /__auth/devices and /__auth/devices/:id/revoke.
- Login throttling after six failed attempts per source IP.
- Same-origin validation on login/logout and mutating requests; no permissive CORS.
- TLS required; gateway refuses to start without certificate and key.
- Internal API token is injected by gateway, never exposed to browser JavaScript.
- Remote access is intended through a private VPN. Never router-port-forward 8443.

## Install (Raspberry Pi / Debian / Ubuntu)
Requires Node.js 20+, npm, OpenSSL, systemd and sudo. Run as a normal user from the repository root:

```bash
npm install
bash scripts/install-lan-server.sh
```

Installer prompts for a 16+ character password, creates a self-signed certificate, writes .env.lan and installs backend/gateway systemd services. It adds no public firewall rules. If UFW is active, allow only the actual trusted subnet, e.g.:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 8443 proto tcp
```

Replace that CIDR with your real LAN. Do not use an allow-from-anywhere rule. Open https://SERVER-LAN-IP:8443. Self-signed TLS causes browser warnings until the certificate is trusted on clients; deploy a private CA for best results.

## Remote access
Use a private VPN such as WireGuard or Tailscale. Keep backend on loopback, do not forward port 8443, and restrict the firewall to trusted LAN/VPN ranges. VPN setup varies by deployment and is intentionally separate.

## Operations
```bash
sudo systemctl status nexora-backend nexora-lan-gateway
sudo journalctl -u nexora-backend -u nexora-lan-gateway -f
sudo systemctl restart nexora-backend nexora-lan-gateway
```

To invalidate all sessions, stop the gateway, remove data/lan-sessions.json and restart. Update NEXORA_LAN_PASSWORD_B64 in .env.lan (base64-encoded UTF-8 password) to change the password.

## Health
GET /api/health reports gateway TLS state and local backend reachability. All other API routes require a device session.

## Limits
The certificate is self-signed and not automatically trusted by browsers. Rate-limit counters reset on restart. Keep the service behind firewall/VPN controls. Configure and test a local model separately; this gateway does not invent or download a model runtime.
