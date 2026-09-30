---
gate: G3
question: "Does slice 2 (A person can sign in, finish signing up and sign out) do what its criteria say?"
recommendation: "Starting containers, and downloading Keycloak, a JDK or a browser, all needed approval nobody was there to give."
opened: 2026-09-30T16:41:19.766Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 2 (A person can sign in, finish signing up and sign out) do what its criteria say?

**Recommendation.** Starting containers, and downloading Keycloak, a JDK or a browser, all needed approval nobody was there to give.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've rebuilt how sign-in completes so that all six returned criteria should now be met, but I couldn't prove it on the running sandbox. Starting containers, and downloading Keycloak, a JDK or a browser, all needed approval nobody was there to give. So the fix is backed by a diagnosis from reading the code and by unit and end-to-end tests without containers, not by the acceptance suite.

**The cause.** One cause explains all six failures (R-4.1, R-4.2, R-4.3, R-4.17, R-4.22, R-4.24), and also why R-4.6, R-4.23, R-4.27 and R-4.28 passed: a visitor satisfies each of those. The single-page app finished signing in only after `/auth/callback` had loaded. It swapped the code for tokens, asked the service for the session (which is what created the account) and then moved to the landing page. A browser that moves on as soon as it is back on the application interrupts all of that:
- no account is created and no welcome message is sent (R-4.1, R-4.2);
- the address read is still `/auth/callback`, not the landing page (R-4.22);
- the next page opens as a visitor, so `/sign-up/complete` sends the person to sign in and its checkboxes never appear. That is the `setChecked` timeouts in R-4.3 and R-4.24;
- `/sign-out` says "signed out" while the identity provider's session is still live (R-4.17).

The old service finished sign-in in a server-side redirect, so everything was settled before any page loaded.

**What I changed.**
- **The service answers both addresses.** `/auth/sign-in` and `/auth/callback` are now the service's own redirects, as the contract describes them.
  - `/auth/sign-in` makes a fresh state and PKCE verifier, keeps them in a cookie only the service can read, and sends the browser to Keycloak.
  - `/auth/callback` checks the state and exchanges the code as the public client, with no secret anywhere. It checks the token as every `/api` request's is checked, then finds or creates the account and sends the welcome. Finally it redirects to the page sign-in began from, `/sign-up/complete` or `/dashboard`.
  - Any failure lands on `/notice/authFailure`, after ending any Keycloak session it made.
- **Tokens arrive with the redirect.** The tokens reach the app in short-lived cookies set on the same redirect. The app moves them into local storage as it starts, before any network call, so leaving the landing page at once no longer loses the sign-in.
- **keycloak-js is gone.** It forced a token refresh on every page load. A small token holder in `app/frontend/src/auth/identity-client.ts` replaces it: it keeps the tokens, renews them only near expiry, and ends the Keycloak session on sign-out as before.
- **Supporting changes:**
  - The request validator now accepts the parameters Keycloak sends back to the callback (`state`, `session_state`, `iss`, `error` and so on), and `code` is optional there. Nothing else is relaxed.
  - The web server forwards `/auth/*` to the service.
  - In the compose file, the service reaches Keycloak on the internal network, and `KC_HOSTNAME=http://localhost:8080` makes every token name the same issuer whichever address it was requested at.
  - The app's own `/auth` screens are removed.

**`build-slice-2-5#1` (R-4.17).** The sign-out logic already ended the session with the service and then with Keycloak, and said success only after both. It never got that far because the browser held no tokens. With the tokens now reliably held, it runs as written.

**Tests.** `npm --prefix app run check` passes: 285 tests across the three workspaces. New or rewritten:
- **Sign-in flow logic:** settings, the authorization address and PKCE challenge (checked against the RFC 7636 worked example), the pending-sign-in cookie, the code exchange and ending a Keycloak session.
- **End-to-end:** the whole redirect flow runs against the real service over PGlite, with a stand-in realm that checks the verifier. It covers:
  - a first-time vendor is created, welcomed and landed on completion with the tokens;
  - a second sign-in reuses the same account;
  - a first-time public sector employee lands on the dashboard;
  - the return page is honoured, and never one off the service;
  - a deactivated account is refused and its Keycloak session ended;
  - a wrong verifier, a callback this browser never began, and an abandoned sign-in each land on the failure notice.
- **Browser side and configuration:** the token holder (taking over the handed-over tokens, renewal, sign-out both ways), the sign-in buttons, the contract change, and the compose and web-server settings.

**Decision for the reviewer.** The stack profile says the single-page app uses the PKCE flow, and decision 0004 said moving the code exchange to the service would be a recorded departure. I recorded it as one in `docs/decisions/0015-sign-in-completes-at-the-service.md`, with the reasons and what would reverse it. I added a "superseded in part" note to 0001, 0003, 0004 and 0011. If the reviewer rules that the page itself must hold the verifier, this approach cannot stand. The same problem would then need another answer, because a page cannot settle the account and landing address before it loads.

**Unverified.** Two things have never been checked against a live stack:
- that Keycloak 26 with `KC_HOSTNAME` issues `localhost:8080` tokens for an exchange made at `idp:8080`;
- that the browser's sign-out call to Keycloak's logout endpoint is allowed cross-origin. If it isn't, the fallback redirect still ends the session.

The next slice should run the sandbox and sign in once through the browser before anything else.

Nothing outside `app/` and `docs/decisions/` was changed, and nothing the plan assigns to other slices was built. Picture upload and the rest of R-4.x remain slice 3's.
