# 0017 · The service keeps a session cookie beside the bearer token

- Status: accepted for the build (slice 2, third revision after the G3 return); supersedes in
  part 0003 ("Every other `/api` route authenticates by a bearer token, not by a cookie" and
  "The existing `sessions` table is kept but the rebuild does not write to it" stand, but a
  request with no token is no longer always a visitor's), 0004 and 0015 ("the service still
  keeps no session of its own")
- Extended by: 0018. The session also keeps the refresh token sign-in completed with, and
  signing out ends the identity provider's session with it
- Date: 2026-09-30

## What happened

Slice 2 came back a third time. R-4.1, R-4.2, R-4.3 and R-4.17 failed on an empty value where
something was expected, and R-4.24 failed on an empty value where a date was expected. The
sign-in flow (0015) and the own-profile screen (0016) were both working. The empty values came
from one place the suite reads a person's account: `user-account-self-request`,
`GET /api/sessions/current` (surface.yaml). Its `user_identifier` and
`new_opportunity_notices_since` are what these criteria are checked against.

The suite runs one set of steps against two targets. The old service answers `/api` from a
session cookie. The sandbox realm allows no direct token grant (`directAccessGrantsEnabled` is
false on the public client), so a test cannot get a bearer token of its own. It signs in
through the browser and then asks `/api` from the same browser, carrying that browser's
cookies and no token. The rebuild answered every request without a token as a visitor's:
`{ "id": null, "user": null }`, which has an empty identifier and an empty notice date.
Decision record 0003 foresaw this ("a test that calls `/api` directly must present a token")
and listed it for ruling. The suite's steps are the answer to that question.

## Decision

**Completing sign-in also begins a session of the service's own**
(`app/backend/src/auth/service-sessions.ts`). `/auth/callback` sets it, on the same redirect that
hands the tokens over, in an `HttpOnly` cookie named `dm-session`, path `/`, `SameSite=Lax`,
for ten hours (Keycloak's default maximum for its own sessions). The cookie holds only a random
identifier. The session stands for the identity the checked access token named at sign-in. A
session this browser held before is ended when a new one begins.

**A request under `/api` with no bearer token is answered for whoever its session cookie
names** (`bearerTokenCheck`). A missing, unknown, expired or signed-out cookie session makes the
request a visitor's, as before. It is not refused. A bearer token, when a request carries one,
always decides, so the single-page app works exactly as it did. What the person may do is still
decided per request from the `users` table (0001, departure 2). An account an administrator
deactivates is refused on the next request, whichever way the request was identified.

**Signing out ends it** (R-4.17). `DELETE /api/sessions/current` ends the cookie's session and
every other session begun from the same identity-provider session, and clears the cookie. The
page's own request carries both the bearer token and the cookie, so one request ends both.
After that, `GET /api/sessions/current` from the same browser answers with nobody.

The sessions are held in memory, like the list of sessions signed out of (0011). A sandbox runs
one backend. The kept `sessions` table is still not written to: its columns record an access
token and a user, and this session needs the identity-provider session and the identity, which
it would have to fit into those columns awkwardly.

## Consequences

- A request the app did not make, such as a link opened by the browser, now reaches `/api` as the
  person who signed in. File downloads (slice 3) and printable exports can be plain links after
  all. They no longer need to be fetched with the token and handed over (0003, 0004), though
  that still works.
- Cookie authentication on requests that change things brings the usual cross-site question.
  `SameSite=Lax` keeps the cookie off cross-site `POST`, `PUT` and `DELETE`. Those requests also
  send a JSON body, which a cross-site form cannot. No CSRF token is added.
- A cookie session can outlive the identity provider's session when that session ends by
  idling out rather than by signing out. It still ends at ten hours, and on signing out.

## What would reverse it

- A ruling that the acceptance suite presents bearer tokens when it calls `/api`, together with a
  realm client that lets it get one. The cookie would then be unnecessary.
- A backend run as more than one instance. The sessions would then move into shared storage,
  most naturally the kept `sessions` table.
