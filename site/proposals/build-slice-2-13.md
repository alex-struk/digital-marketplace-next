| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T23:17:44.668Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does slice 2 (A person can sign in, finish signing up and sign out) do what its criteria say?

**Recommendation.** I left the application unchanged in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I left the application unchanged in this revision. The ruling asked me to recheck R-4.1 and R-4.3 against the rebound adapter and, if either still read empty, find where the app departs from the criterion. I couldn't do that recheck against the running app. Reading the code, I found nothing in the app to correct for either criterion.

**What stopped the live check.** Starting the compose stack (`docker compose … up --build`) needs a permission this unattended session can't get, so I never had a running app or sandbox identity provider to sign in to. I also have neither the adapter nor the acceptance tests. The adapter rebinding the ruling depends on is filed with the bind-adapter stage, and I have no sign that it has run. So I can't say what either criterion now reads.

**What I checked instead.** I followed both criteria from sign-in to the markup the adapter reads.

- **R-4.1 (the account a first sign-in creates).**
  - Seed users `first-time-gov` and `first-time-vendor` are in the sandbox realm. Each carries an `identity_provider` attribute, and the service maps it to an account kind: `idir` makes a public sector employee, `github` a vendor.
  - On a first sign-in, `AccountsService.signIn` creates the account. It is active, because that is the database default for a new account. Signing in again finds the same account through `findBySignIn` instead of making a second one.
  - `GET /api/sessions/current` returns the account with its `status`.
  - `/users/me` draws it once the signed-in account is known. `profile-status-badge` shows "Active", on the element carrying that test id, on the profile section every account kind is offered.
  - A unit test in `app/frontend/tests/signing-in.test.tsx` already checks that the badge reads "Active".
  - The earlier empty reading matches what the ruling found: the binding was written before anyone could see this screen signed in. Nothing I found in the app would produce it.
- **R-4.3 (the terms agreement).**
  - `/sign-up/complete` matches its catalogue story and every test id `surface.yaml` lists for `user-sign-up-complete`.
  - `sign-up-complete-button` carries a real `disabled` attribute until `sign-up-terms-checkbox` is ticked. Decision record 0016 already lets the checkbox take a click on its own input.
  - Completing the form saves the profile, then the notice choice, then `acceptTerms`, which records both `acceptedTermsAt` and `lastAcceptedTermsAt`.
  - A public sector employee is never sent to this page, and the service refuses `acceptTerms` for one.
  - For a vendor, the moment of agreeing shows on `/users/me?tab=legal` as `legal-accepted-on` ("You agreed to the terms and conditions on …").
  - The seed's `vendorCompletingProfile` (test-vendor-17) is sent to the completion page from every screen except sign-out, notices and content pages.
  - Unit tests cover the disabled-until-ticked control, the completion requests and the accepted-on text.

**Checks.** After installing the app's dependencies (the workspace had none), `npm --prefix app run check` passes: typecheck plus 101 unit tests in 7 files. I wrote no new tests, because I changed no code.

**What I did not do, because other stages own it.**
- I did not touch `tests/adapters`. The rebinding of `/dashboard`, `/users/:userId`, the own profile's status and the profile-completion form belongs to bind-adapter.
- I did not move R-6.20 or R-6.28 to other slices; that belongs to the plan stage. R-6.20 needs the Code With Us create screen from slice 7, and R-6.28 needs another person's profile from slice 3.

**Where the next check should look.** Once the adapter has been bound against signed-in screens, the recheck should run again. If R-4.1 or R-4.3 still reads empty then, the place to look is what the bound selector finds on the live page. The markup and data these two criteria need are in place.

**What the next slice will find missing.** Nothing new since the last revision. Slice 3 still owns editing the profile, the picture, capabilities, organizations, changing the notice choice, unsubscribing, deactivation, and `GET /api/users/{id}`, as decision record 0016 describes.

_Ruled: return by runner:verify_
