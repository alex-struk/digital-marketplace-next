| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T12:43:51.582Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 2 (A person can sign in, finish signing up and sign out) do what its criteria say?

**Recommendation.** I built slice 2 and `npm --prefix app run check` passes: 15 migration tests, 153 backend and 74 frontend.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I built slice 2 and `npm --prefix app run check` passes: 15 migration tests, 153 backend and 74 frontend. I could not run the sandbox itself: every `docker` command needs an approval nobody was here to give. So the parts that only a live Keycloak, Caddy and Mailpit can prove have been checked by reading and by the compose test, not by running them.

## The criteria, and where each is reached

- **R-4.1 (the first sign-in makes the account):** the sign-in and sign-up screens send the person to the sandbox Keycloak realm (PKCE with a public client, no secret in the browser). `/auth/callback` swaps the code for tokens, then calls `GET /api/sessions/current` with the token. On a first sign-in that call makes the account, active, with notices off and no job title. The kind comes from the token's `identity_provider` claim: `idir` makes a public sector employee, `bceid` or `github` a vendor. Signing in again finds the same account. An identity the service doesn't recognise is refused and lands on `/notice/authFailure`.
- **R-4.2 (welcome message):** sent once, after the account is saved, with a "Sign in" link. Nobody is written to when the account has no email address.
- **R-4.3 (terms):** on `/sign-up/complete`, "Complete profile" stays unavailable until the terms box is ticked. Agreeing records both `acceptedTermsAt` and `lastAcceptedTermsAt`. The service refuses a terms agreement from anyone but a vendor.
- **R-4.6 (one account per identity, no shared email per kind):** the schema's unique constraints enforce it. A clash at first sign-in gives the generic sign-in failure notice; a clash when saving the profile gives the generic "could not be saved" alert.
- **R-4.17 (sign-out):** `/sign-out` tells the service first. The service then refuses every token from that session until they would have expired. The browser then drops its tokens and ends the Keycloak session, which returns it to "You have successfully signed out". If the service can't be told, the page shows the failed state and nothing is signed out. Pages that need a signed-in person send a visitor to sign in.
- **R-4.22 (where sign-in lands):** the page sign-in began from, carried as `redirectOnSuccess` (only paths on this service are accepted). Otherwise the completion page for a vendor who hasn't agreed to the terms, and the dashboard for everyone else.
- **R-4.23 (who sees the completion page):** only a vendor who has never agreed to the terms. Everyone else goes to the dashboard, and a visitor to sign in. Until that vendor finishes, every screen sends them back, except signing out, the notices and the service's own pages (they need those to read the terms).
- **R-4.24 (notice choice):** ticking the box records the moment; unticking empties the record.
- **R-4.27 (profile rules):** one shared validation rule, used by both the form and the service. Email is stored in lower case, and the sign-in username is shown read-only.
- **R-4.28 (no job title for vendors):** the completion page never shows a job title field. A save that doesn't carry one keeps whatever is stored.
- **R-6.1 to R-6.5, R-6.20, R-6.28 (the mail path):** one sender, which must be "Name <address>" or the service won't start. No reply-to. Test marking (`[TEST] ` subject and the test logo), and an environment switch to turn all mail off. Each message is written once and rendered to both the formatted and plain-text forms. Delivery happens after the action is saved, over a fresh connection, and is never retried. A failure goes to the log with no address in it and never fails the action. Recipients with no address are skipped, and a run of several messages carries on past one that fails.

**Unit tests** cover the shared rules, the mail path, token checking and the sign-out list, and the account service (against in-memory storage). An end-to-end backend test runs the real service over the migrated schema, with a published key set and a small SMTP catcher. The frontend tests cover every new screen with a stand-in identity provider, including axe scans of each.

## Things I had to fix or decide that weren't strictly this slice's

- **The contract stopped every request.** Two response descriptions in `spec/contract/openapi.yaml` have an unquoted comma, so YAML reads half the sentence as a stray key. The request validator then rejected the whole document and every route, slice 1's included, answered 500. The backend now rejoins those sentences when it loads the contract. The file itself belongs to the spec stage: quoting those two descriptions fixes it.
- **`/api/sessions/current` failed the contract.** The contract types that `{id}` as a UUID, but the surface names `current`. The boundary accepts that one word on that one path.
- **The seed no longer applied, so `check` failed before I changed anything.** The acceptance seed has grown past slice 1's reconstructed schema: service area 5 was the wrong name, and the Code With Us proposal tables, a Team With Us attachment table and eight evaluation tables were missing. I added three migrations and rewrote slice 1's seed test to check named records instead of row counts.
- **The realm needed more.** I added eight personas (`test-vendor-13` to `17` and the three first-time identities), the claim and audience mappers, and a user profile where email is optional. Without it, Keycloak 26 would stop no-email users at an "update your account" page.

These choices are recorded in decision records 0011 (sign-in and the session), 0012 (the schema gaps) and 0013 (the mail path).

## Not verified, and what the next slices will find missing

- **Needs a live run.** The Keycloak realm import with the profile config and mappers, the 8080/4300 addresses, and Mailpit's fault injection are untested. The Mailpit image is still `:latest`, because I couldn't pull a version to pin.
- **Slice 3** will need to wire the picture picker (it's on the completion page but can't store anything yet). It also owns the profile screens and `GET /api/users/{id}`, the unsubscribe and settings links in message footers, and letting a self-deactivated account back in (R-4.5). Until then such an account is refused like any inactive one.
- **Refused for now.** The update tags `updateCapabilities`, `reactivateUser` and `updateAdminPermissions`.
- **Shells only.** The dashboard is a heading and who is signed in. The header offers only sign in/up or dashboard/sign out.
- **Slice 6** needs the slow-delivery mail proxy for R-6.24; it isn't in the compose file.
- **Slice 7** needs batching into groups of fifty (R-6.8).
- **Slice 5** will meet the seed restoring 22 service pages between tests, where the plan settles on 16.
- The frontend bundle is now over Vite's 500 kB warning size.

_Ruled: return by runner:verify_
