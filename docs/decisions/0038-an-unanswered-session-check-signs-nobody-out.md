# 0038 · An unanswered session check signs nobody out

- Status: accepted for the build (slice 8, second revision after the ruling that returned it)
- Date: 2026-10-01
- Amends: 0018 (how the app finds out who is using it), 0020 (what a browser without tokens is)

## What was wrong

Every screen starts by asking `GET /api/sessions/current` who is signed in. The single-page app
read any request that did not complete as a *refused* sign-in. Leaving a page while that question
is on its way — which is what a person following a link a moment after a page appears does, and
what a test does when it opens its next address as soon as the last one has loaded — aborts the
request, and the app then:

1. wiped the tokens it held, and its `dm-signed-in` cookie with them, and
2. began leaving the "refused" sign-in, sending the browser to the identity provider's sign-out.

The next page then found no tokens, and because a browser holding no tokens was taken to be a
visitor's without the service being asked, it was drawn for a visitor: no Unpublished group on the
opportunity list (R-1.3, R-1.38), the sign-in prompt instead of the dashboard's rows, and where the
identity provider's sign-out won the race, the sign-in failure notice instead of the page a link
led to (R-7.18). Driven locally in Chromium against the service over the seed, the administrator's
list never showed its Unpublished group after this happened, where it otherwise shows within about
a tenth of a second.

## Decision

- `fetchCurrentSession` (`app/frontend/src/api/accounts.ts`) answers `unanswered` when the request
  did not complete or the service faulted (5xx). Only the service's own answers decide anything:
  401 is a visitor (the token is no longer accepted, and is dropped), 200 names the account or
  nobody, and any other refusal is a refused sign-in (R-4.1, R-4.4).
- An `unanswered` check draws that page as a visitor's and leaves the tokens, the cookie and the
  identity provider's session alone, so the next page asks again.
- The service is asked on every visit, tokens or not. It also knows the person by its `HttpOnly`
  session cookie (0017), and the screens now show whoever it answers for, rather than deciding
  "visitor" in the browser. A browser whose cookies are cleared holds neither the cookie nor the
  `dm-signed-in` flag, so it is still a visitor's (0020).

## What would reverse it

A ruling that a browser without tokens must never be shown as signed in, whatever the service's
own session says: then the app goes back to not asking without tokens, and keeps the rest.
