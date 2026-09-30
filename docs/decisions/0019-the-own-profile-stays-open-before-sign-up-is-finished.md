# 0019 · One's own profile stays open before sign-up is finished

- Status: accepted for the build (slice 2, revision after the G3 return); supersedes in part
  0011 ("Until it is complete, every screen except the completion page, signing out, the
  notices and the service's own pages sends a vendor back to it")
- Date: 2026-09-30

## What happened

Slice 2 came back with R-4.1 and R-4.2 failing the same way. A person signing in for the first
time with a code-hosting identity opened `/users/me` to see the account that had been made:
its identifier and its email address. The app sent them to `/sign-up/complete` instead. The
reason was the rule in 0011: a vendor who has never agreed to the terms is sent to the
completion page from every screen except a few. The own profile was not one of the few.

No criterion asks for that rule to cover the profile. R-4.26 says any signed-in person can
open their own profile at the address that stands for them. R-4.1 and R-4.2 are checked by
reading the account a first sign-in made, and a vendor's first sign-in always makes an
account that has not agreed to the terms yet.

## Decision

**A vendor who has not finished signing up can still open their own profile**, at `/users/me`
and at `/users/<their own id>`. `openBeforeProfileCompletion` in
`app/backend/src/rules/sign-in.ts` takes the person's own identifier for this. Every other
screen still sends them to finish signing up, as `tests/seed/manifest.yaml` describes for
`vendorCompletingProfile`. Someone else's profile is not covered.

**Every account just made lands on the completion page** when sign-in did not start from a
particular page (R-4.22, and the note on R-4.23: every newly created account is sent there
whatever its kind). Before this, a new public sector account went straight to the dashboard.
The completion page still moves anybody it is not offered to on to the dashboard, so where the
person ends up is the same. The route there now matches the specification. `/auth/callback`
passes `created` from `AccountsService.signIn` to `landingAfterSignIn`.

## What would reverse it

- A ruling that a vendor must finish signing up before they can see even their own profile.
  The profile would then drop out of `openBeforeProfileCompletion`, and R-4.1 and R-4.2 would
  have to be checked somewhere other than the profile screen.
