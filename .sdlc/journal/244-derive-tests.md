---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-29T07:09:29.865Z"
cost: 0.7516644
turns: 20
session: "d8b34fc3-73f9-4499-bdd6-63ccbd18a42d"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

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