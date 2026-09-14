---
stage: "derive-tests"
title: "derive-tests: post-checks failed"
at: "2026-09-14T01:31:24.037Z"
cost: 4.882538499999999
turns: 81
session: "d12e7c2e-f906-40b7-842b-fc540edcabe1"
---

Of the 30 users criteria, 20 now have a test file under `tests/acceptance/users/` and 10 have an entry in `tests/acceptance/not-testable.yaml`. No criterion has both. I haven't run or typechecked the suite: `tests/node_modules` isn't installed and running scripts needed approval. I checked by hand that every call matches `tests/generated/surface.d.ts`, and a search found none of the patterns the separation check refuses.

**Starting state.** The users folder already held 25 spec files from an earlier pass. They were written against an older contract: they called `userProfile.open()` with no argument or with `{ user }`, where it now requires `{ userId }`, and they predated the `userProfileSelf*` pages. I rewrote all of them. Where a person acts on their own record, the tests now use the self pages. `userProfile.open({ userId })` is used only where an administrator looks at somebody else, or a person looks at an account by its ID.

**Seed finding.** Every seeded vendor has a last-accepted-terms date, including `vendor-with-terms-reset`. Under R-4.23 v2 the profile-completion page is offered only to a vendor who has never agreed, so no account a test can sign in as ever reaches it. The earlier pass had tested R-4.3 and R-4.24 by announcing new terms and then using that vendor. That contradicts R-4.23 v2, so I removed those two files, along with R-4.18, R-4.19 and R-4.31.

**Tested:** R-4.4, 4.5, 4.6, 4.8, 4.9, 4.12, 4.14, 4.16, 4.17, 4.22, 4.23, 4.25, 4.26, 4.27, 4.28, 4.29, 4.30, 4.32, 4.33, 4.34.

Several of these cover only the part of the criterion the surface can reach. The file comments name what is left out:
- **Never observable here:** recorded dates, who deactivated an account, and any email wording (R-4.5, 4.9, 4.30). The email tests only check that a message arrived.
- **No first-time sign-in:** the new-account half of R-4.6 and R-4.22.
- **No starting page for sign-in:** being returned to the page sign-in began from (R-4.22), because `signIn` takes only a persona.
- **R-4.17:** whether the identity provider's session also ended, and what a failed sign-out shows.
- **R-4.32:** what the exported file contains.
- **R-4.23:** the never-agreed vendor being offered the page.

I avoided guessing at on-screen words. Where the surface has no vocabulary, a value is compared with itself before and after a change (status badge, account kind, notification checkbox). "Deactivated by an administrator" versus "by the owner" is read from what happens next: a sign-in is refused (R-4.4) or let back in (R-4.5). Names for R-4.14 are read off each profile, since the seed doesn't expose them.

Every test that changes shared seeded accounts puts them back, except one side effect I couldn't avoid. Announcing changed terms (R-4.16, R-4.33) withdraws every vendor's standing acceptance. These tests re-accept only for the vendors they use, and other domains' tests announce too.

**Not testable:**
- **R-4.1, blocked:** there is no persona whose sign-in identity has no seeded account. It needs one with a government identity, one with a code-hosting identity, and one of neither kind.
- **R-4.2, blocked:** it needs the same first-time personas, plus a `mail` method that lists every message so an empty catcher can be shown.
- **R-4.3 and R-4.24, blocked:** they need a vendor persona that has never accepted any terms. Completing the page uses up that account.
- **R-4.13, unobservable:** "the service has no way to create the first administrator" is a claim that something doesn't exist, which no observation can prove.
- **R-4.18, blocked:** it needs `user-profile` observations `edit_control_offered` and `account_controls_offered`. It also needs an action that submits a profile change against a named account, with a `refused_when_not_own` observation.
- **R-4.19, blocked:** it needs `user-profile.reactivation_control_offered` and `reactivates_by_signing_in_notice`. It also needs an action that requests reactivation of a named account, with a refusal observation.
- **R-4.20, blocked:** it needs a `mail` method that reads one message's body by its ID. `observables.yaml` already names that body, but the fixture doesn't expose it.
- **R-4.21, blocked:** it needs `user-list.refused_for_non_administrator`.
- **R-4.31, blocked:** it needs these additions:
  - a `deactivation_control_offered` observation
  - an action that requests deactivation of a named account without going through the screen control
  - an `already_inactive_error` observation
  - a second administrator persona with a working sign-in

**Missing from the contract, by kind:**
- **First-time identities:** no persona signs in without an existing account, and no seeded vendor has never agreed to terms.
- **Whether a control is offered:** the edit, reactivate and deactivate controls on the profile pages exist only as actions. Nothing reports whether they are there.
- **Direct requests with refusals:** there are no actions that act on a named account without its screen control, and none of those refusals can be read.
- **Two `mail` methods:** read one message's body by its ID, and list every message.
- **One list refusal:** `user-list.refused_for_non_administrator`.

## Fix turn

I made no edits this pass. I also couldn't confirm that the suite compiles: running the TypeScript compiler needed an approval this session didn't have.

The failures named five criteria: R-4.3, R-4.18, R-4.19, R-4.24 and R-4.31. Each had both a spec file and a `not-testable.yaml` entry, and those spec files didn't compile. When I looked, none of the five files was in `tests/acceptance/users/`, and nothing matching them was anywhere else in the workspace. Their yaml entries were still there. So the last pass had already settled all five as not testable and removed the tests; the failures were reported against the earlier state, when both still existed. That means no criterion has both a test and an entry now, and the files carrying the compile errors are gone.

I kept the yaml entries rather than restoring and fixing the tests, because rereading the user-profile pages in the surface backs up their reasons. `user-profile` and `user-profile-self` name `editProfile`, `deactivateAccount` and `reactivateAccount` only as actions. Nothing reports whether one of those controls is offered, which is exactly what R-4.18, R-4.19 and R-4.31 turn on. Nothing reports a refusal of a request aimed at another person's account, or of deactivating an account that's already inactive. And no action sends such a request other than through the control the interface holds back. R-4.3 and R-4.24 depend on `user-sign-up-complete`, which no seeded vendor can reach.

In place of the compiler, I searched the twenty remaining spec files for the two mistakes it had reported: a user-profile `open` called with no argument, or with a `user` key instead of the `userId` the contract takes. There were no matches. That is weaker evidence than a clean compile, so the next stage should run the compiler before relying on the suite.

tests/acceptance/not-testable.yaml: R-4.3 also has a test
tests/acceptance/not-testable.yaml: R-4.18 also has a test
tests/acceptance/not-testable.yaml: R-4.19 also has a test
tests/acceptance/not-testable.yaml: R-4.24 also has a test
tests/acceptance/not-testable.yaml: R-4.31 also has a test
the acceptance suite does not compile; every diagnostic below is in acceptance/users/, which this run wrote:
acceptance/users/R-4.18.spec.ts(19,29): error TS2554: Expected 1 arguments, but got 0.
acceptance/users/R-4.18.spec.ts(23,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.18.spec.ts(31,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.19.spec.ts(17,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.19.spec.ts(26,29): error TS2554: Expected 1 arguments, but got 0.
acceptance/users/R-4.19.spec.ts(31,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.24.spec.ts(21,42): error TS2554: Expected 1 arguments, but got 0.
acceptance/users/R-4.24.spec.ts(29,42): error TS2554: Expected 1 arguments, but got 0.
acceptance/users/R-4.3.spec.ts(45,41): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.31.spec.ts(17,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.31.spec.ts(20,29): error TS2554: Expected 1 arguments, but got 0.
tests/acceptance/not-testable.yaml: R-4.3 also has a test
tests/acceptance/not-testable.yaml: R-4.18 also has a test
tests/acceptance/not-testable.yaml: R-4.19 also has a test
tests/acceptance/not-testable.yaml: R-4.24 also has a test
tests/acceptance/not-testable.yaml: R-4.31 also has a test
the acceptance suite does not compile; every diagnostic below is in acceptance/users/, which this run wrote:
acceptance/users/R-4.18.spec.ts(19,29): error TS2554: Expected 1 arguments, but got 0.
acceptance/users/R-4.18.spec.ts(23,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.18.spec.ts(31,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.19.spec.ts(17,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.19.spec.ts(26,29): error TS2554: Expected 1 arguments, but got 0.
acceptance/users/R-4.19.spec.ts(31,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.24.spec.ts(21,42): error TS2554: Expected 1 arguments, but got 0.
acceptance/users/R-4.24.spec.ts(29,42): error TS2554: Expected 1 arguments, but got 0.
acceptance/users/R-4.3.spec.ts(45,41): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.31.spec.ts(17,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
acceptance/users/R-4.31.spec.ts(20,29): error TS2554: Expected 1 arguments, but got 0.