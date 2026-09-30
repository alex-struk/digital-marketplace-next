---
stage: "build"
title: "build slice 2"
at: "2026-09-30T11:23:17.010Z"
cost: 17.687287800000004
turns: 303
session: "99b79f08-aa49-45d3-bc68-116237005827"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I've built slice 2, and `npm --prefix app run check` passes: typecheck plus 15 migration, 105 backend and 62 frontend tests. The biggest caveat is that I never started the sandbox. Every `docker compose` command needed interactive approval, so the compose file, the Keycloak realm import, and the mail catcher and hold proxy have only been checked by reading them and by the composition unit test, not by starting them.

**How each criterion is reached**
- **Signing in (R-4.1, R-4.22).** `/sign-in` and `/sign-up` are built from their stories. Each button sends the browser to Keycloak by PKCE, with a hint for the identity kind (`github` for a vendor, `idir` for a public sector employee). No secret is held in the browser. `/auth/sign-in` does the same from the contract's own address.
- **The callback.** `/auth/callback` exchanges the code, then calls `GET /api/sessions/current`. It sends the person back to the page sign-in began from if there was one. Otherwise a vendor who has never agreed to the terms goes to `/sign-up/complete` and everyone else to `/dashboard`. `/dashboard` is only a signed-in shell here; its content belongs to the opportunities and proposals slices.
- **Checks on every `/api` route.** A global guard checks the bearer token against the realm's keys, issuer and client. It then loads the account, whose kind and status are read from `users`, not from the token.
- **Creating the account (R-4.1, R-6.20).** `/api/sessions/current` finds the account by sign-in username. On a first sign-in it creates one: `idir` makes a public sector employee, `github` a vendor. Job title starts blank, and notices and terms start unset.
- **Refusals (R-4.4, R-4.6).** An unrecognised identity kind, an inactive account, or a new vendor whose email another vendor holds gets a 403. The app then shows `/notice/authFailure`, after ending the Keycloak session so the next attempt starts fresh.
- **Welcome (R-4.2).** A new account with an email address is sent the welcome message.
- **Finishing signing up (R-4.3, R-4.23, R-4.24, R-4.27, R-4.28).** `/sign-up/complete` shows the form only to a vendor who has never agreed to the terms. Everyone else signed in goes to the dashboard, and a visitor goes to sign in. "Complete profile" stays disabled until the terms box is ticked. There is no job title field. Validation is one shared rule used by browser and service: a name of 1–100 characters and a valid email, stored in lower case. Saving records the profile, then the notice choice if ticked, then the agreement. Every other screen except the content pages sends an unfinished vendor to this page.
- **Sign-out (R-4.17).** `/sign-out` asks the service to end the session, clears the browser's tokens, and ends the Keycloak session. It shows success, loading or failure as the stories do. The service also refuses tokens from an ended session and refuses to end anyone else's.
- **Mail path (R-6.1–R-6.5, R-6.28).** Every message goes through one `Mailer`:
  - one configured sender, with no separate reply-to;
  - a formatted form plus a plain-text form rendered from it;
  - `[TEST]` in the subject and a test logo when the environment is a test one;
  - nothing sent when notifications are switched off;
  - delivery after the action has already answered, failures logged without addresses and never retried;
  - recipients with no address skipped.

  Compose adds Mailpit with fault injection on, a toxiproxy "hold" proxy, and both control APIs on :8025.

**What I unit-tested**
- The shared account rules.
- Every mail-path rule, including the plain-text rendering.
- End to end over the kept schema and the real seed files, with locally signed tokens and a tiny mail server: first sign-in, the welcome, the refusals, finishing sign-up, sign-out and the cookie carrier.
- In the frontend: PKCE and the code exchange, where people land after sign-in, the completion form, the redirects, sign-out, the notices, and axe checks of the new screens.

**Choices I made (records 0011–0013)**
- I hand-wrote the PKCE flow rather than using the plan's `keycloak-js`, because that keeps tokens in memory only and every full page load would need another trip to Keycloak.
- Tokens live in local storage and are also copied into a cookie scoped to `/api`, so plain links and direct requests carry the person's identity.
- The loaded contract accepts `current` as a session id.
- In the realm I changed vendors from `bceid` to `github`, added every seeded and persona account including the three first-time identities, and enabled direct password grants so API-level tests can get a token.

**Fixes outside this slice's features.** These were needed because the check was already failing before I changed anything:
- `openapi.yaml` has descriptions that YAML splits at an unquoted comma, which made the validator reject every request. The service now repairs them as it loads the contract; the spec file is unchanged.
- The seed grew to 16 files. I added two migrations built from the seed's own inserts: service area 5 becomes Service Designer, and the Code With Us proposal, attachment and evaluation tables the seed writes into are created. I also loosened two slice 1 migration-test expectations that counted seed rows.

**What the next slice will find missing**
- An account its owner deactivated is still refused at sign-in. Letting it back in and reactivating it (R-4.5) is slice 3's, and the place is marked in `AccountsService.signIn`.
- The profile-picture button on the completion form does nothing yet.
- `GET /api/users/{id}` and the other account-change tags are not built.
- Batching for messages to many people is left to slice 7.

Nothing in the specification had to be built differently from how it is written.