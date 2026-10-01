---
gate: G3
question: "Does slice 6 (An administrator can announce changed terms, and vendors accept them again) do what its criteria say?"
recommendation: "The proxy is configured, but whether it answers at `localhost:8025/hold` will only be known on the next verify run."
opened: 2026-10-01T06:13:21.407Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 6 (An administrator can announce changed terms, and vendors accept them again) do what its criteria say?

**Recommendation.** The proxy is configured, but whether it answers at `localhost:8025/hold` will only be known on the next verify run.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether slice 6 (announcing changed terms, and vendors accepting them again) does what its criteria say. The ruling is approve. The verify result is pass for all seven claimed criteria (R-4.16, R-4.33, R-6.18, R-6.23, R-6.24, R-6.28, R-7.13). It is recorded for build-slice-6-5 against application tree e1a13da, which matches the app/ tree at the branch head, so it is current. R-6.24 was unbound last revision and now passes, which confirms in practice the Toxiproxy and Caddy setup the author could not start locally. The code does what the criteria say and nothing beyond them. The announcement withdraws every vendor's acceptance (deactivated vendors included) and keeps lastAcceptedTermsAt. It answers before any vendor is read or mailed, by deferring that work with setImmediate. It mails each active vendor separately, skips a vendor with no address, and goes on past a vendor the mail server refuses. The message names all three programs and offers no unsubscribe. Only the terms-and-conditions managing screen carries the action. The legal section warns the vendor, re-reads the account when opened, and records a fresh acceptance. Unit tests cover the new seams: TermsAnnouncement against an in-memory store with the order of events asserted, a backend end-to-end test over migrations and seed, refreshHeldAccount's stale-answer guard, and the screens including an axe accessibility check. No secret or personal data appears in the code or its logs. The new log line prints only an error name. No protected path is touched. The egress failures are all in earlier slices' files, not this diff. The revision carries out build-slice-6-4#1 in full. The ruling would change if R-6.24 or any claimed criterion failed or was unbound on a current run.

**Conditions:**
- condition-met build-slice-6-4#1: The sandbox's mail now goes through Toxiproxy service mail-hold, which runs one proxy named smtp on 1025 forwarding to mail:1025 (app/compose/mail/toxiproxy.json). The backend's SMTP_HOST points at mail-hold. Caddy service mail-front (app/compose/mail/Caddyfile) is the only service published on 8025. It serves Mailpit at the root, chaos fault injection included, and Toxiproxy's control API under /hold with the prefix stripped (app/compose/compose.yaml). The change is recorded in docs/decisions/0028-mail-goes-through-a-delay-proxy.md and app/README.md. Verify for build-slice-6-5 passed R-6.24, R-6.28 and the other claimed criteria against tree e1a13da.
