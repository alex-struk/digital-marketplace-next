---
gate: G3
question: "Do these tests follow from the users criteria and from nothing else?"
recommendation: "I rewrote both criteria (R-4.3 and R-4.24) as tests."
opened: 2026-09-29T00:15:06.897Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the users criteria and from nothing else?

**Recommendation.** I rewrote both criteria (R-4.3 and R-4.24) as tests.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote both criteria (R-4.3 and R-4.24) as tests. Neither needed a whole-criterion `not-testable.yaml` entry. Nothing was run: there is no application in this workspace. I also didn't type-check the files or parse the YAML, because those commands needed an approval that isn't available in this session.

**R-4.3** (`tests/acceptance/users/R-4.3.spec.ts`): The ruling said the old test signed in as an established vendor and never reached the agreement step. It also first had an administrator announce changed terms to withdraw that vendor's acceptance. The new test drops both. Each vendor test now signs in as `persona.firstTimeVendor`. That is an identity the sandbox identity provider has and the seed does not, so the account is created at that sign-in and has never agreed to anything. The file has three tests, one for each outcome the criterion states:
- **Cannot finish before agreeing:** the agreement box is present on the profile-completion page, and what `completeDisabledUntilTermsAccepted()` reports changes once `acceptAppTerms()` is ticked. The contract doesn't say what value that observation returns, so the test checks only that it changes.
- **Acceptance time is recorded:** after ticking and completing, the vendor's own legal page shows an `acceptedOnNotice()` that contains a digit.
- **Public sector employee is never asked:** `persona.firstTimePublicSectorEmployee` opens the profile-completion page and no agreement box can be read.

I left out a check the old test made, that the "terms updated" warning is absent, because the criterion doesn't ask for it.

**R-4.24** (`tests/acceptance/users/R-4.24.spec.ts`): Same fix. The person is now `persona.firstTimeVendor` completing their profile for the first time, instead of an existing account put back on the page by an administrator's announcement. They tick the new-opportunity notices box, agree to the terms and complete their profile. Their own notification settings then have to show a value that is non-empty and different from what `persona.vendorWithNoticesOff` shows. That seeded account has notices off, which gives a baseline to compare against, since the contract doesn't say what the checkbox observation returns for "on". The old test's final step, turning the setting back off, is gone: each test resets to the seed first, and the criterion never asks for it.

**Clause entry (R-4.24):** I added one entry beside the test in `tests/acceptance/not-testable.yaml`, marked `blocked:` with owner `contract`. It covers the clause "their account records that notifications are on, with the moment the choice was made". The test checks that the choice is saved but cannot check when it was made. `userProfileSelfNotifications` offers only `newOpportunitiesCheckbox`, `notificationEmailAddress` and `unsubscribeModal`, and no other page reports that date and time.

**Missing from the surface:** an observation on `user-profile-self-notifications` (or `user-profile-notifications`, for an administrator viewing another account) that reports the date and time new-opportunity notices were turned on.

**Worth knowing:** Both rewritten tests depend on `firstTimeVendor`, and `firstTimePublicSectorEmployee` is used too. Neither can sign in on the current application under test, because it has no identity provider. Both work only on the rebuilt target's sandbox identity provider, as the persona entries themselves say.

I changed nothing outside `tests/acceptance`.
