---
gate: G1
question: "6 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-6.1, R-6.2, R-3.9, R-1.16, R-4.23, R-4.24 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-29T06:06:53.010Z
---

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

