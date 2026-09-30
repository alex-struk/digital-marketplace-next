# 0020 · Clearing the browser's cookies signs it out

- Status: accepted for the build (slice 2, revision after the G3 return that named R-4.23);
  amends 0011 and 0015 on where the browser keeps its sign-in
- Date: 2026-09-30

## What happened

Slice 2 came back with R-4.23 failing: a value the check expected read as empty. Record 0018
already notes how the acceptance harness signs a person out between two people in one test.
It clears the browser's cookies and opens the home page. It never opens `/sign-out`, and it
leaves local storage alone.

On the oracle, the session is a cookie, so this signs the person out. Here the tokens were
kept in local storage and nowhere else. After the cookies were cleared, the app still presented
the previous person's bearer token and still drew every screen for them. The sign-in screen
even sent the browser on to that person's dashboard. R-4.23 is the only criterion in this slice
whose check uses two different people one after the other: a public sector employee signing in
for the first time, then a vendor who has agreed to the terms. A second person arriving in a
browser that still belongs to the first is a departure from the oracle that this criterion
would see.

The rebuilt target could not be run in this revision, because the sandbox could not be started
from this session. So this record is a reasoned correction, not one confirmed against the
running application.

## Decision

**The tokens in local storage count only while the browser also holds the cookie
`dm-signed-in`.** That cookie holds a flag and nothing else. It is set whenever tokens are kept,
which happens when a completed sign-in's handover is adopted and when the tokens are renewed.
It is cleared whenever they are forgotten. Tokens found without it are dropped, and the app
then starts as a visitor's. A request made afterwards carries no token.

The tokens themselves stay in local storage, so no request carries them in a cookie header. The
service's own `HttpOnly` session cookie (0017) is cleared along with the flag, so after the
harness's sign-out neither the page nor the service answers for the earlier person.

## What would reverse it

- Moving the tokens themselves into cookies. The flag would then be unnecessary.
