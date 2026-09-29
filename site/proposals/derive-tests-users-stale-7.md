| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T07:09:29.895Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** I rewrote the tests for R-4.23 and R-4.24 in `tests/acceptance/users/`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote the tests for R-4.23 and R-4.24 in `tests/acceptance/users/`. Both carry the new headers (spec@0518dcc…, derived 2026-09-29). Neither criterion needed a `not-testable.yaml` entry, and I didn't change that file. I couldn't type-check or run the tests because the workspace has no installed dependencies. I did check every page, action and observation name against `tests/generated/surface.d.ts`.

**R-4.23 (v2), four tests, one per clause.** The ruling said the first case needs a vendor who has never agreed to the terms, taken from the seed rather than made by announcing changed terms. That persona now exists: `vendorCompletingProfile` (seed `users.vendorCompletingProfile`, marked as never having agreed). The first test signs in as that vendor and expects the terms checkbox on the profile-completion page. No test announces changed terms any more.
- **Vendor who has agreed before:** I used the seeded `vendorWithTermsReset`. The seed marks this vendor as having agreed once but not to the current terms. That is the case the ruling said the second clause sends to the dashboard, and it is the one that separates "has agreed before" from "agrees now".
- **Signed-in person who is not a vendor:** public sector staff.
- **Visitor not signed in:** the test opens the page without signing in at all. The old version signed in and then out, which the criterion doesn't need.

"Sent to their dashboard" is read as the terms checkbox being absent plus the dashboard's own table or its empty message being present. Accepting either one means the test doesn't depend on what the dashboard happens to list. "Sent to sign in" is read as the sign-in page's vendor card being present.

**R-4.24 (v1), one test.** The ruling said the old test never reached the profile-completion form. The new test signs in as `vendorCompletingProfile` and first checks that the account has no notices date yet. It then opens the completion form and confirms it is showing (terms checkbox present) before doing anything on it, so a run that never reaches the form fails at that point. It ticks the new-opportunity notices box, agrees to the terms (only because completing the profile requires it), and completes the profile. Finally it reads the account record through `userAccountSelfRequest` and expects a valid date for when notices were turned on, within a window around the completion that allows five minutes for clock differences.

**Notes for the next contract stage:**
- The comment on `user-sign-up-complete` in `spec/contract/surface.yaml` still says every account a sign-in route creates on the oracle already has a finished profile. `vendorCompletingProfile`, reachable at `/auth/createsessionvendor/17`, now contradicts that. The contract stage should correct the comment; it isn't this stage's file to change.
- The surface has no observation that names the dashboard itself, whoever is looking at it. The redirect is therefore inferred from a dashboard table or empty message. An observation for "the dashboard is shown", on both `opportunity-dashboard` and `proposal-vendor-dashboard`, would make those assertions direct.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten R-4.23 and R-4.24 tests follow from their criteria and from nothing else? Approve. R-4.23 has one test per clause. The never-agreed vendor comes from the seed (vendorCompletingProfile) and is offered the terms checkbox. The vendor who agreed before (vendorWithTermsReset, whose persona can 'agree to the current terms again') and public sector staff each get no checkbox plus their own dashboard's table or empty message; accepting either keeps the check independent of what the dashboard happens to list. A visitor who never signs in is shown the sign-in page. R-4.24 checks the account starts with no notices date and that the completion form is showing, then ticks the notices box and completes the profile (agreeing to the terms only because completion requires it), and reads back a valid date within a clock-drift window of the completion. That date covers both 'notifications are on' and 'the moment the choice was made'. No selectors, routes, status codes or table names appear. Every persona and observation used exists in the generated surface and seed. The runner's typecheck reports nothing under acceptance/users/. The ruling would change if a calibration run showed that the dashboard table-or-empty-message check cannot tell the dashboard apart from some other screen, or that vendorWithTermsReset is not in fact a vendor who agreed before.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `84fdc4847ff7846d3eb0c781e958f8165f1ccf69`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/users/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
