| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T00:15:06.897Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the rewritten R-4.3 and R-4.24 tests follow from the users criteria and from nothing else? Ruling: approve. The prior return (test signed in as an established account and never reached the profile-completion step) is answered: every test now begins as persona.firstTimeVendor or persona.firstTimePublicSectorEmployee, both defined in spec/contract/personas.yaml with sandbox-idp identities. R-4.3's three tests map one-to-one onto its outcomes: the completion control's availability changes once the agreement box is ticked (the contract does not state the observation's value, so a change is what can be asserted); after completing, the vendor's own legal section carries an accepted-on notice containing a date (R-4.33 names that section as where the moment of agreement is stated); a first-time public sector employee is not offered the agreement box. The dropped terms-updated-warning assertion was not asked for by the criterion. R-4.24 asserts the choice made during profile completion is saved, held against a seeded notices-off account, and its unasserted clause (the moment the choice was made) carries a not-testable.yaml clause entry owed by contract whose reason is real: user-profile-self-notifications in spec/contract/surface.yaml declares only new_opportunities_checkbox, notification_email_address and unsubscribe_modal, and the checks already show missing-test/R-4.24 open against contract. No selector, route, status code or table leaks in. The runner typecheck reports no diagnostics under acceptance/users; its failure is in adapters/new, outside this proposal. What would change the ruling: evidence from a run that the public-sector test passes without reaching the page, since readOrEmpty turns any failed read into an absent checkbox, or a contract change stating the completion control's observed values, which would call for the direction to be asserted rather than only the change.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `14adda2b09f88ede8755b0f69de4d66393c6ea73`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/users/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
