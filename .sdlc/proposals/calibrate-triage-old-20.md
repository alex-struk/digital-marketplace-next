---
gate: G3
question: "12 criterion(s) fail against old, and 2 criterion(s) are still unbound after bind-adapter's sends: which of them did this project's own adapter cause, and which can the oracle not reach?"
recommendation: "Sort R-6.1, R-2.9, R-8.11, R-5.13, R-4.14, R-1.16, R-2.16, R-8.20, R-2.22, R-4.23, R-2.28, R-2.37, R-3.9, R-2.19 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-29T01:10:54.254Z
---

# 12 criterion(s) fail against old, and 2 criterion(s) are still unbound after bind-adapter's sends: which of them did this project's own adapter cause, and which can the oracle not reach?

**Recommendation.** Sort R-6.1, R-2.9, R-8.11, R-5.13, R-4.14, R-1.16, R-2.16, R-8.20, R-2.22, R-4.23, R-2.28, R-2.37, R-3.9, R-2.19 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

12 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
2 criterion(s) are unbound on the **old** target after bind-adapter was sent them as often as `policy.loops.rebind` allows.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

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

### R-4.14 · v1

An administrator can browse everyone registered with the service, listed by status, then account kind, then name, showing each person's status, account kind, name and whether they are an administrator, and can narrow the list by typing part of a name.

- given: an active vendor, a deactivated vendor and a public sector employee registered with the service
- when: an administrator opens the list of users and then types part of one person's name
- then: all three are listed with the active accounts before the inactive ones, and the list narrows to the people whose names match what was typed
- test: tests/acceptance/users/R-4.14.spec.ts

**an administrator can browse everyone registered with the service, showing each person's status, account kind, name and whether they are an administrator** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.16 · v1

A Sprint With Us opportunity must have an implementation phase, and may only have an inception phase if it also has a prototype phase.

- given: a member of public sector staff creating or editing a Sprint With Us opportunity that is not a draft
- when: they include an inception phase but no prototype phase
- then: the submission is rejected with a message saying a prototype phase must follow an inception phase
- test: tests/acceptance/opportunities/R-1.16.spec.ts

**A Sprint With Us opportunity must have an implementation phase** — failed

```
Error: opportunity-swu-create.publish — "Publish" is disabled on http://localhost:3100/opportunities/sprint-with-us/create; the form marks "5. Phases" incomplete
```

**A Sprint With Us opportunity may only have an inception phase if it also has a prototype phase** — failed

```
Error: opportunity-swu-create.publish — "Publish" is disabled on http://localhost:3100/opportunities/sprint-with-us/create; the form marks "5. Phases" incomplete
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

### R-4.23 · v2

The profile-completion page is offered only to a vendor who has not yet agreed to the terms; a vendor who has agreed before and any signed-in person who is not a vendor are sent to their dashboard instead, and a visitor who is not signed in is sent to sign in.

- given: a public sector employee signing in for the first time, and a vendor who has already agreed to the terms once
- when: each is sent to the profile-completion page
- then: both are moved straight on to their dashboard without being asked to confirm anything
- test: tests/acceptance/users/R-4.23.spec.ts

**the profile-completion page is offered to a vendor who has not yet agreed to the terms** — failed

```
Error: unbound: user-sign-up-complete.name_field — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

**a vendor who has agreed before is sent to their dashboard instead** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"redirected to /dashboard"[39m
```

**any signed-in person who is not a vendor is sent to their dashboard instead** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"redirected to /dashboard"[39m
```

**a visitor who is not signed in is sent to sign in** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"redirected to /sign-in"[39m
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

### R-2.37 · v1

Anyone entitled to read a proposal can take away a printable copy of it, and staff reading a Sprint With Us or Team With Us copy see the anonymous proponent name until the proposal reaches the challenge stage.

- given: a Sprint With Us proposal under review on its team questions
- when: the opportunity's author opens its printable copy, and then the vendor who wrote it opens the same copy
- then: the staff copy names the proponent only as "Proponent 1" while the vendor's own copy names the organization, and once the proposal reaches the code challenge the staff copy names the organization too
- test: tests/acceptance/proposals/R-2.37.spec.ts

**the vendor's own copy of a Sprint With Us proposal names the organization** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"Northern Pines Digital Ltd."[39m
```

## Unbound after binding

Every failing test of each criterion below ended in the adapter's own `unbound:` error, quoted as it said it, and
bind-adapter was sent each 2 or 3 times without binding it. Answer `adapter-wrong` where the
application does offer what the test needs — under another label, behind a step, as another persona —
and the binding run goes back for it. Answer `oracle-cannot` only where the oracle genuinely cannot be
driven into, or observed in, the state the test needs without changing its code: behind an external
identity provider, reachable only through a link the application emails, enforced only by a
browser-native dialog. It is never a way to skip binding work. Answer `product-question` where the
criterion itself looks suspect.

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

### R-2.19 · v2

A Sprint With Us proposal must offer a team for every phase the opportunity requires and no phase it does not, name no more than one scrum master in each phase, cover every capability the opportunity requires across its phases, and stay within each phase's budget and the opportunity's total budget.

- given: a Sprint With Us opportunity with an inception phase and a set of required capabilities
- when: a vendor submits a proposal that omits the inception phase, names two scrum masters, leaves a required capability uncovered, or proposes a total cost above the opportunity's maximum budget
- then: each of those submissions is refused, naming the phase, the team or the cost as the reason
- test: tests/acceptance/proposals/R-2.19.spec.ts

**a Sprint With Us proposal must offer a team for every phase the opportunity requires** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3102/opportunities/sprint-with-us/create
```

**a Sprint With Us proposal must offer no phase the opportunity does not require** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3102/opportunities/sprint-with-us/create
```

**a Sprint With Us proposal may name no more than one scrum master in each phase** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3102/opportunities/sprint-with-us/create
```

**a Sprint With Us proposal must cover every capability the opportunity requires across its phases** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3102/opportunities/sprint-with-us/create
```

**a Sprint With Us proposal must stay within each phase's budget** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3102/opportunities/sprint-with-us/create
```

## Triage conditions

One condition per line, one for every criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
  On an unbound row it sends the binding back to `bind-adapter` however often it has been sent.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID. On an unbound row, use it when the criterion itself looks suspect.
- `oracle-cannot <ID>: <why>` — only for a row listed as unbound, on the oracle's target: the
  oracle genuinely cannot be driven into, or observed in, the state the test needs without
  changing its code — the state sits behind an external identity provider, is reachable only
  through a link the application emails, or is enforced only by a browser-native dialog.
  `<why>` names that state and why the oracle cannot reach it. It closes the row, changes no
  criterion, and stands until the criterion's version changes. It is never a way to skip binding
  work: where the application offers the control under another label, behind a step or as
  another persona, the answer is `adapter-wrong`.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.


## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is which of the 14 failing or unbound criteria against the old target the adapter under tests/adapters/old/ caused, and which go to the product owner. Ruling: approve, with one triage condition for each criterion. Each failure was read against its test and the adapter code. Five come from the adapter. R-2.19: the adapter copies publish's opportunity-level start and completion dates onto the form's starting phase (Prototype), overwriting the dates addPhase already gave it. The phases then overlap and the form refuses to publish. R-1.16: publish throws when Publish is disabled with the Phases step marked incomplete, which is the very refusal the test is written to read. R-2.37: anonymousProponentName falls back to whatever stands under the 'Proponent' label, which is the organization's name. R-4.23: termsCheckbox returns a non-empty 'redirected to …' where no checkbox exists. R-4.14: a column reader answered empty on the same /users table from which userRow had just read the named rows. The other nine show the adapter reading the page faithfully: the site sends messages or finalises consensus when the test expects otherwise, the site's own wording differs, a blob read is not permitted, a form stays incomplete after the organization change the test made, the history observation sits on a screen the contract gives only to staff, or a shared seeded invitation is consumed by a sibling test. Those are for the product owner to answer. If the next binding run brings any adapter-wrong row back with the reader demonstrably reading the right element, it goes to the product owner. If calibration evidence showed R-6.1 was run against an instance with notifications on, that would be a calibration setup issue to fix, not a product ruling.

**Conditions:**
- adapter-wrong R-2.19: opportunity-swu-create.publish splits the input's opportunity-level startDate/completionDate off as phase dates and calls addPhase on the form's starting phase (Prototype), overwriting the 28-to-60-day dates the test's own addPhase gave it with 28-to-90. Prototype then overlaps Implementation (starting day 61), the Phases step becomes invalid, and publish returns quietly on /opportunities/sprint-with-us/create. It must not write opportunity-level dates onto a phase the test has already given dates to.
- adapter-wrong R-1.16: opportunity-swu-create.publish throws when 'Publish' is disabled with '5. Phases' marked incomplete and no message shown. That disabled Publish is the form refusing the phases it was given, which the test reads afterwards (dashboard, or fieldError). publish must end quietly there, as it already does when the form shows a message, and fieldError must report what the Phases step marks incomplete.
- adapter-wrong R-2.37: proposal-swu-export-one.anonymous_proponent_name returns the text under the 'Proponent' label when no 'Proponent N' appears, so the vendor's own copy reads 'Northern Pines Digital Ltd.' as an anonymous name. It must answer empty unless the copy shows an anonymised 'Proponent N' name.
- adapter-wrong R-4.23: user-sign-up-complete.terms_checkbox returns the non-empty 'redirected to /dashboard' or 'redirected to /sign-in' when the page sends the visitor elsewhere, so the tests' 'no terms checkbox offered' assertion reads a checkbox as present. It must answer empty when no terms checkbox is on the page. complete_disabled_until_terms_accepted must likewise answer empty after such a redirect rather than throw unbound.
- adapter-wrong R-4.14: on /users, after user_row had read rows for the named accounts from the table (rows split on their Active/Inactive badge), one of user-list.status_badge, account_type or admin_check answered empty. status_badge and account_type scan page text lines against fixed labels, and admin_check looks for an svg in each row's last cell. Each must read its column from the same table rows user_row reads and answer non-empty for a rendered list.
- product-question R-6.1
- product-question R-2.9
- product-question R-8.11
- product-question R-5.13
- product-question R-2.16
- product-question R-8.20
- product-question R-2.22
- product-question R-2.28
- product-question R-3.9
