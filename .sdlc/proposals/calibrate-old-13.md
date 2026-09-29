---
gate: G1
question: "9 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?"
recommendation: "Rule on R-6.1, R-2.9, R-3.9, R-8.11, R-5.13, R-2.16, R-8.20, R-2.22, R-2.28 with a calibration condition, so the next calibrate run can apply it."
opened: 2026-09-29T01:14:45.239Z
---

# 9 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-6.1, R-2.9, R-3.9, R-8.11, R-5.13, R-2.16, R-8.20, R-2.22, R-2.28 with a calibration condition, so the next calibrate run can apply it.

9 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
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

### R-2.9 · v1

A vendor may read the history of a proposal they authored, or of a proposal belonging to an organization they own or administer, in all three programs.

- test: tests/acceptance/proposals/R-2.9.spec.ts

**a vendor may read the history of a proposal they authored, in all three programs** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a vendor may read the history of a proposal belonging to an organization they own or administer, in all three programs** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-3.9 · v1

A pending invitation becomes an active membership only when the invited person accepts it, or when an administrator accepts it on their behalf; nobody else can accept it and an invitation that is not pending cannot be accepted.

- given: a person with a pending invitation to an organization
- when: the organization's owner tries to accept it on their behalf, and then the invited person accepts it themselves
- then: the owner's attempt is refused, the invited person's acceptance makes the membership active, and a further attempt to accept the now-active membership is refused as not pending
- test: tests/acceptance/organizations/R-3.9.spec.ts

**a pending invitation becomes an active membership when an administrator accepts it on the invited person's behalf** — failed

```
Error: unbound: organization-user-memberships.approve_invitation — looked on http://localhost:4300/users/00000000-0000-4000-8000-000000000209?tab=organizations for a pending row for "Salt Marsh Labs Ltd." showing "Approve" when pointed at (0 such rows), then opened the invitation's own address for affiliation 00000000-0000-4000-8000-000000000407 and no "Approve Request?" confirmation opened on http://localhost:4300/users/me?tab=organizations&invitationAffiliationId=00000000-0000-4000-8000-000000000407&invitationResponse=approve; the signed-in person has no unanswered invitation there
```

### R-8.11 · v1

Asking for a file without requesting its content returns a description of it — its identifier, its name and the date it was stored — under the same permission rules as the content itself.

- given: a stored file the requester may read
- when: they ask for it without requesting its content
- then: its identifier, name and stored date are returned, and its content is not
- test: tests/acceptance/files/R-8.11.spec.ts

**a description of a file is given under the same permission rules as the content itself** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-8.11 same rules 1790642012947"[39m
Received string:    [31m""[39m
```

### R-5.13 · v1

Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out.

- test: tests/acceptance/evaluation/R-5.13.spec.ts

**Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out.** — failed

```
Error: the consensus scores were finalised

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m"Team Questions Consensus"[39m
Received: [31m"Code Challenge"[39m
```

### R-2.16 · v1

A Sprint With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program, and the organization is re-checked at the moment of submission.

- given: a draft Sprint With Us proposal naming an organization that has since lost its qualified status
- when: the vendor submits it
- then: the submission is refused, and a proposal naming no organization at all is refused with "An organization must be specified before submitting."
- test: tests/acceptance/proposals/R-2.16.spec.ts

**a Sprint With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program** — failed

```
Error: unbound: proposal-swu-create.set_scrum_master — no team member row for "Blake Placeholder" with a Scrum Master choice on http://localhost:3100/opportunities/sprint-with-us/cf72bd39-4afd-4a44-b427-f038b44e7ebe/proposals/create
```

**the organization a Sprint With Us proposal names is re-checked at the moment of submission** — failed

```
Error: unbound: proposal-swu-create.set_scrum_master — no team member row for "Blake Placeholder" with a Scrum Master choice on http://localhost:3100/opportunities/sprint-with-us/10ff5058-2fb6-404d-b7d6-31c34a1c2d6c/proposals/create
```

**a Sprint With Us proposal naming no organization at all is refused** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"organization must be specified"[39m
Received string:    [31m""[39m
```

### R-8.20 · v1

A file attached to an opportunity or a proposal is readable by whoever may read the thing it is attached to, under one rule covering Code With Us, Sprint With Us and Team With Us alike rather than a separate rule per program.

- test: tests/acceptance/files/R-8.20.spec.ts

**a file attached to a Code With Us opportunity is readable by whoever may read the opportunity** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-8.20 code with us 1790642052271"[39m
Received string:    [31m""[39m
```

**a file attached to a Team With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-8.20 team with us 1790642110712"[39m
Received string:    [31m""[39m
```

### R-2.22 · v1

Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn.

- given: a submitted Sprint With Us or Team With Us proposal
- when: the vendor edits it and names a different organization
- then: the edit is refused with "Organization cannot be changed once the proposal has been submitted", while the same edit on a draft or withdrawn proposal is accepted
- test: tests/acceptance/proposals/R-2.22.spec.ts

**Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn. (a withdrawn Team With Us proposal may be moved to another organization)** — failed

```
Error: proposal-twu-edit.save_changes — "Save Changes" is disabled on http://localhost:3100/opportunities/team-with-us/7ab6b713-4313-4ecd-bd4a-56e0aa92a73e/proposals/e07bfb87-712b-4db0-86f7-dd9c84ea2e6a/edit; the page shows: Please select a resource name
```

### R-2.28 · v1

Sprint With Us and Team With Us proposals advance through the evaluation stages one at a time, and an action taken at the wrong stage of the opportunity is refused.

- given: a Sprint With Us opportunity still in its code challenge stage
- when: someone enters a team scenario score for one of its proposals
- then: the request is refused with "The opportunity is not in the correct stage of evaluation to perform that action."
- test: tests/acceptance/proposals/R-2.28.spec.ts

**Sprint With Us and Team With Us proposals advance through the evaluation stages one at a time, and an action taken at the wrong stage of the opportunity is refused. (a team scenario score entered while a Sprint With Us opportunity is at its code challenge is refused)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"The opportunity is not in the correct stage of evaluation to perform that action."[39m
Received string:    [31m"If this proposal is screened into the Team Scenario, it can be scored once the opportunity reaches the Team Scenario too."[39m
```

**Sprint With Us and Team With Us proposals advance through the evaluation stages one at a time, and an action taken at the wrong stage of the opportunity is refused. (a challenge score entered while a Team With Us opportunity is at question consensus is refused)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"The opportunity is not in the correct stage of evaluation to perform that action."[39m
Received string:    [31m"If this proposal is screened into the Challenge, it can be scored once the opportunity has reached the Challenge too."[39m
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

