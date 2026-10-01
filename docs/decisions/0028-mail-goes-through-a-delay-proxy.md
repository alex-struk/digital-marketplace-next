# 0028 · The sandbox's mail goes through a delay proxy

- Status: accepted for the build (slice 6, revision)
- Date: 2026-09-30

## Decision

R-6.24 asks that an administrator announcing changed terms is told at once, while the messages
are still being sent. From outside the application that can only be seen by holding delivery
back, so the sandbox in `app/compose/compose.yaml` now carries the delay proxy
`spec/contract/observables.yaml` describes (`email.delivery_delay`).

- **`mail-hold`** is Toxiproxy (`ghcr.io/shopify/toxiproxy`) with one proxy, `smtp`, listening
  on 1025 and forwarding to the catcher's SMTP port (`mail:1025`). Its configuration is
  `app/compose/mail/toxiproxy.json`. The backend's `SMTP_HOST` is `mail-hold`, so every message
  the service sends goes through it. With no toxic in force it passes everything unchanged.
- **`mail-front`** is Caddy (`app/compose/mail/Caddyfile`) and is the only service published on
  `localhost:8025`. It serves Mailpit's own interface and API at the root, unchanged — so the
  message list and the chaos fault injection R-6.2 and R-6.28 rely on are reached exactly as
  before — and Toxiproxy's control API (its port 8474) under `/hold`, with the prefix removed.

So, from the host:

| | |
|---|---|
| read | `GET http://localhost:8025/hold/proxies/smtp/toxics` — `[]` when nothing is held |
| slow | `POST` the same address with a latency toxic named `hold` (3000 ms, downstream) |
| restore | `DELETE http://localhost:8025/hold/proxies/smtp/toxics/hold` |
| restore everything | `POST http://localhost:8025/hold/reset` |

Toxiproxy refuses callers whose user agent begins `Mozilla/`, as a guard against cross-site
requests from a browser. Caddy replaces the user agent on the `/hold` route, so a test driving
it from a browser-backed request context is not turned away.

Three seconds of latency is under the five-second greeting timeout the mailer keeps (decision
record 0013), so a held message is slowed, not refused; lifting the hold lets it finish.

The catcher's SMTP port is no longer published on the host; nothing outside the compose
network sent to it, and anything that did would bypass the proxy.

## What would reverse it

A sandbox that observes "answered before sending" some other way — none is offered by the
contract — or a contract that moves the proxy's control API elsewhere.
