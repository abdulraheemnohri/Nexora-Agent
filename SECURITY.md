# Security Policy

## Supported version
Security fixes target the latest code on `main`.

## Reporting a vulnerability
Do not publish API keys, private model files, or exploitable details in a public issue. Contact the repository owner privately through GitHub's security reporting feature when available.

## Deployment rules
- Keep the API bound to `127.0.0.1` unless an authenticated, TLS-protected deployment has been deliberately configured.
- Store secrets only in an untracked `.env` file or an OS-managed secret store.
- Do not commit local databases, model files, tokens, or API keys.
- Do not set cloud fallback to true without understanding data-transfer and billing implications.
- The LiteRT adapter uses argument arrays and subprocess execution without a shell; only configure arguments after inspecting your installed CLI.
- Learned skills are instruction records. Never execute model-generated code automatically.
- Test and inspect proposed changes before approval. Back up the database before upgrades.
