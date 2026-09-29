| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-29T06:06:53.010Z |
| holder | agent:product-owner |

# 6 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-6.1, R-6.2, R-3.9, R-1.16, R-4.23, R-4.24 with a calibration condition, so the next calibrate run can apply it.

6 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

### R-6.1 · v1

When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.

- given: a service configured with notifications disabled
- when: a person does something that would ordinarily notify somebody, such as publishing an opportunity
- then: the action succeeds and reports success, and no message is sent to anybody
- test: tests/acceptance/notifications/R-6.1.spec.ts

**When notifications are switched off for an environment, nothing the service does sends a message, and every action that would have sent one still completes normally.** — failed

```
Error: messages sent with notifications switched off

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m11[39m
```

### R-6.2 · v1

When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.

- given: a service whose mail server is unreachable
- when: a person publishes an opportunity that would notify everyone who asked for new-opportunity notices
- then: the opportunity is published and the person is told it succeeded, no notice reaches anybody, and nothing in the service records for that person that delivery failed
- test: tests/acceptance/notifications/R-6.2.spec.ts

**When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.** — failed

```
Error: only the invitation is in the catcher

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m1[39m
Received: [31m8[39m
```

### R-3.9 · v1

A pending invitation becomes an active membership only when the invited person accepts it, or when an administrator accepts it on their behalf; nobody else can accept it and an invitation that is not pending cannot be accepted.

- given: a person with a pending invitation to an organization
- when: the organization's owner tries to accept it on their behalf, and then the invited person accepts it themselves
- then: the owner's attempt is refused, the invited person's acceptance makes the membership active, and a further attempt to accept the now-active membership is refused as not pending
- test: tests/acceptance/organizations/R-3.9.spec.ts

**a pending invitation becomes an active membership when an administrator accepts it on the invited person's behalf** — failed

```
Error: unbound: organization-user-memberships.approve_invitation — looked on http://localhost:3101/users/00000000-0000-4000-8000-000000000217?tab=organizations for a pending row for "Northern Pines Digital Ltd." showing "Approve" when pointed at (0 such rows), then opened the invitation's own address for affiliation 00000000-0000-4000-8000-000000000413 and no "Approve Request?" confirmation opened on http://localhost:3101/users/me?tab=organizations&invitationAffiliationId=00000000-0000-4000-8000-000000000413&invitationResponse=approve; the signed-in person has no unanswered invitation there
```

### R-1.16 · v1

A Sprint With Us opportunity must have an implementation phase, and may only have an inception phase if it also has a prototype phase.

- given: a member of public sector staff creating or editing a Sprint With Us opportunity that is not a draft
- when: they include an inception phase but no prototype phase
- then: the submission is rejected with a message saying a prototype phase must follow an inception phase
- test: tests/acceptance/opportunities/R-1.16.spec.ts

**A Sprint With Us opportunity may only have an inception phase if it also has a prototype phase** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/prototype/i[39m
Received string:  [31m"5. Phases is incomplete"[39m
```

### R-4.23 · v2

The profile-completion page is offered only to a vendor who has not yet agreed to the terms; a vendor who has agreed before and any signed-in person who is not a vendor are sent to their dashboard instead, and a visitor who is not signed in is sent to sign in.

- given: a public sector employee signing in for the first time, and a vendor who has already agreed to the terms once
- when: each is sent to the profile-completion page
- then: both are moved straight on to their dashboard without being asked to confirm anything
- test: tests/acceptance/users/R-4.23.spec.ts

**the profile-completion page is offered to a vendor who has not yet agreed to the terms** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-4.24 · v1

While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.

- given: a vendor completing their profile
- when: they tick the box offering notice of new opportunities and complete the profile
- then: their account records that notifications are on, with the moment the choice was made
- test: tests/acceptance/users/R-4.24.spec.ts

**While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.** — failed

```
Error: unbound: user-sign-up-complete.toggle_new_opportunity_notifications — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

## Calibration conditions

One condition per line, and exactly one of these forms:

- `defect-in-old <ID>` — the old application really does fail this and the criterion is right
  anyway. The test stands as written and the rebuild has to pass it; the criterion keeps a note
  saying so. No text after the ID.
- `spec-wrong <ID>: <corrected statement>` — the criterion misdescribes what the old application
  does. The statement is replaced and its version bumped, which marks the test stale so
  `derive-tests --stale` writes it again from the corrected criterion.
- `test-wrong <ID>: <why>` — the criterion is right and the test is not. The id goes to
  `tests/acceptance/redo.yaml` for `derive-tests` to redo, still blind, and `<why>` records what
  the test got wrong without describing how the application is built.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. `defect-in-old`
takes no text; the other two require a colon and text on the same line. A condition may not span
more than one line.


## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: which of R-6.1, R-6.2, R-3.9, R-1.16, R-4.23 and R-4.24, failing against old, are the application's fault, the spec's, or the test's? Ruling: approve with five conditions (one defect-in-old, one spec-wrong, three test-wrong). R-6.1 is deliberately left unruled because none of the three forms is true of it. The old application honours the switch: makeSend returns before composing anything when DISABLE_NOTIFICATIONS is set (sources/old/src/back-end/lib/mailer/transport.ts:54). The test is written for an instance started that way and tagged @notifications_disabled. Its 11 messages show it ran against the default instance with notifications on. What unblocks it is a calibrate run that starts a second oracle with SDLC_ORACLE_DISABLE_NOTIFICATIONS=1, runs only the tagged test there and excludes that test from the default run; a ruling does not. R-6.2 is test-wrong: the old sender logs a delivery or composition failure and resolves, and nothing retries (transport.ts:33-45 and 55-66). The extra messages in the catcher are therefore not evidence of a second attempt; they are consistent with the action's own notices arriving once, after the test restored delivery. R-3.9 is spec-wrong. The service does permit an administrator to approve another person's affiliation (permissions.ts:284-291), but calibrate-triage-old-22 established that no old screen offers that to an administrator. As a product, the old application lets only the invited person accept, and the owner is refused. Carrying an on-behalf acceptance forward would oblige the rebuild to build a consent-bypassing feature the old product never exposed. The corrected statement keeps every clause the old application demonstrably honours. R-1.16 is defect-in-old. The old service carries exactly the criterion's message, 'A prototype phase must follow an inception phase.' (back-end/lib/resources/opportunity/sprint-with-us/index.ts:634 and 1257). The old form refuses the same arrangement earlier, showing only '5. Phases is incomplete', which tells staff the phases are wrong without telling them why. The rule is kept and the stated reason is a fair obligation on the rebuild. R-4.23 is test-wrong: the old page admits a vendor only if they have never agreed (sign-up/step-two.tsx:65, lastAcceptedTermsAt), which matches the criterion. The test manufactures 'not yet agreed' by announcing changed terms, and that produces a vendor who has agreed before, whom the criterion itself sends to the dashboard. R-4.24 is test-wrong for the same underlying reason: no persona the test can sign in as has an unfinished profile, so the form is never reached. Both need a first-time vendor supplied by the seed and fixtures (already noted as a seed gap at derive-tests-users-3). What would change this ruling: a decision that administrators must be able to accept invitations on a person's behalf would turn R-3.9 into defect-in-old against the original statement. A catcher trace showing the same notice delivered twice would make R-6.2 defect-in-old. A first-time vendor who reaches the form and still is not offered it, or whose choice is not saved, would make R-4.23 or R-4.24 a product question.

**Conditions:**
- test-wrong R-6.2: the test restores delivery without first showing that the action's notices have all been refused, then counts everything in the catcher as a further attempt; a notice arriving once after delivery is restored is its first and only delivery, not a repeat. The test must tell a repeat from a single late delivery, for example by waiting until the refused deliveries have settled before restoring, or by showing no notice about the published opportunity arrives more than once, rather than requiring the catcher to hold nothing but the invitation
- spec-wrong R-3.9: A pending invitation becomes an active membership only when the invited person accepts it; the organization's owner cannot accept it on their behalf, and an invitation that is not pending cannot be accepted.
- defect-in-old R-1.16
- test-wrong R-4.23: the first case makes its vendor 'not yet agreed' by announcing changed terms, but a vendor whose agreement was withdrawn by a change of terms has still agreed before, which the criterion's own second clause sends to the dashboard; the first case needs a vendor who has never agreed to the terms, and that persona has to be supplied by the seed and fixtures rather than derived from an established vendor
- test-wrong R-4.24: the test never reaches the profile-completion form because every persona it can sign in as has already completed their profile; it needs a vendor who has never completed their profile, supplied by the seed and fixtures, and must tick the new-opportunity notice while completing it
