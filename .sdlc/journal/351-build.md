---
stage: "build"
title: "build slice 6"
at: "2026-10-01T06:13:21.357Z"
cost: 0.714767
turns: 30
session: "272dc8c4-89cf-4c33-9524-514df2b81d11"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've added the delay proxy that R-6.24's test needs to the sandbox, but I couldn't start any containers here, so it hasn't been tried out. The proxy is configured, but whether it answers at `localhost:8025/hold` will only be known on the next verify run. That run is what turns R-6.24 from unbound to pass or fail.

**What the ruling found.** Six of the slice's seven criteria passed (R-4.16, R-4.33, R-6.18, R-6.23, R-6.28, R-7.13). R-6.24 came back unbound: the backend sent mail straight to the Mailpit mail catcher, so nothing could slow delivery. Without that, nobody outside the application can see that the administrator is told before the messages go out. No application code changed in this revision; only the sandbox, its docs and a decision record did.

**Changes to `app/compose/compose.yaml`:**
- **`mail-hold`** is a new Toxiproxy service. It runs one proxy named `smtp` that listens on 1025 and forwards to `mail:1025`; its setup is in `app/compose/mail/toxiproxy.json`. The backend's `SMTP_HOST` now points at `mail-hold`, so every message goes through it, and with nothing held it changes nothing.
- **`mail-front`** is a new Caddy server and is now the only service published on `localhost:8025`; its config is `app/compose/mail/Caddyfile`. Mailpit's interface and API are at the root, unchanged, so the message list and the fault injection used by R-6.2 and R-6.28 are reached exactly as before. Toxiproxy's control API (port 8474) is under `/hold` with the prefix removed. That gives:
  - `GET /hold/proxies/smtp/toxics` to read what is held;
  - `POST` to the same address to add a delay;
  - `DELETE /hold/proxies/smtp/toxics/hold` to remove it;
  - `POST /hold/reset` to clear everything.
- **User agent.** Toxiproxy turns away any caller whose user agent starts with `Mozilla/`. Caddy replaces the user agent on the `/hold` route, so a test sending requests through a browser isn't refused.
- **Mailpit** is no longer published on the host. Its SMTP port was published on 1025 before; that publication is gone, so nothing can send mail around the proxy.

**Timing.** The spec's delay is 3 seconds and the mailer gives up on a server that hasn't greeted it within 5. A held message is therefore slowed, not refused, and finishes once the delay is lifted. I left the mailer's timeouts alone.

**Documentation.** Decision record `docs/decisions/0028-mail-goes-through-a-delay-proxy.md` explains the new mail path and how its control API is reached. I added a paragraph to `app/README.md`, and updated the line in record 0013 that said the proxy was still missing.

**Not checked.** Every `docker compose` command I tried here (`up`, `config`) needed an approval nobody could give, so I couldn't bring up the containers or call any of the `/hold` addresses. Two things in particular are unconfirmed:
- that `ghcr.io/shopify/toxiproxy:latest` runs `/toxiproxy` and accepts the `-host` and `-config` flags I pass it;
- that Caddy's config parses.

**Verified.** `npm --prefix app run check` passes: typecheck plus 16, 332 and 194 unit tests across the three workspaces. I first had to install dependencies with `npm ci` under `app/`. I changed nothing outside `app/` and `docs/decisions/`.