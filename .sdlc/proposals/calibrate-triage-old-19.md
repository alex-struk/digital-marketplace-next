---
gate: G3
question: "10 criterion(s) fail against old, and 13 criterion(s) are still unbound after bind-adapter's sends: which of them did this project's own adapter cause, and which can the oracle not reach?"
recommendation: "Sort R-1.9, R-2.10, R-5.13, R-1.16, R-2.16, R-2.17, R-2.20, R-2.22, R-2.31, R-2.35, R-4.3, R-4.4, R-2.7, R-2.9, R-2.11, R-4.14, R-2.19, R-2.21, R-4.23, R-4.24, R-2.28, R-1.33, R-2.37 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-28T23:35:36.980Z
---

# 10 criterion(s) fail against old, and 13 criterion(s) are still unbound after bind-adapter's sends: which of them did this project's own adapter cause, and which can the oracle not reach?

**Recommendation.** Sort R-1.9, R-2.10, R-5.13, R-1.16, R-2.16, R-2.17, R-2.20, R-2.22, R-2.31, R-2.35, R-4.3, R-4.4, R-2.7, R-2.9, R-2.11, R-4.14, R-2.19, R-2.21, R-4.23, R-4.24, R-2.28, R-1.33, R-2.37 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

10 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
13 criterion(s) are unbound on the **old** target after bind-adapter was sent them as often as `policy.loops.rebind` allows.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-1.9 · v2

An opportunity saved as a draft is accepted with incomplete content; when its proposal deadline, assignment date or start date is missing or invalid it is set to fourteen days from the day of saving, and its completion date is left empty.

- given: a member of public sector staff filling in a new opportunity
- when: they save it as a draft with fields still blank
- then: the draft is stored, no content validation error is raised, and absent dates are set to fourteen days from the day of saving
- test: tests/acceptance/opportunities/R-1.9.spec.ts

**Code With Us: a draft whose dates are missing is accepted, its proposal deadline, assignment date and start date are set to fourteen days from the day of saving, and its completion date is left empty** — failed

```
Error: proposal deadline "2026-10-11" should be 2026-12 (Pacific) or, across midnight, 2026-12

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

**Sprint With Us: a draft whose dates are missing is accepted, its proposal deadline, assignment date and start date are set to fourteen days from the day of saving, and its completion date is left empty** — failed

```
Error: proposal deadline "2026-10-11" should be 2026-12 (Pacific) or, across midnight, 2026-12

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

**Team With Us: a draft whose dates are missing is accepted, its proposal deadline, assignment date and start date are set to fourteen days from the day of saving, and its completion date is left empty** — failed

```
Error: proposal deadline "2026-10-11" should be 2026-12 (Pacific) or, across midnight, 2026-12

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mfalse[39m
```

**Team With Us: a draft whose dates are invalid is accepted, its proposal deadline, assignment date and start date are set to fourteen days from the day of saving, and its completion date is left empty** — failed

```
Error: completion date should be left empty

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeFalsy[2m()[22m

Received: [31m"2026-10-12"[39m
```

### R-2.10 · v1

A Team With Us proposal is refused when the hourly rates it names, applied at each resource's target allocation across the opportunity's contract period, come to more than the opportunity's maximum budget; the check runs on both the create and the edit path, as the equivalent Sprint With Us check does.

- test: tests/acceptance/proposals/R-2.10.spec.ts

**a Team With Us proposal whose hourly rates come to more than the opportunity's maximum budget is refused on the create path** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

**a Team With Us proposal whose hourly rates come to more than the opportunity's maximum budget is refused on the edit path** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"draft"[39m
Received string:    [31m"submitted"[39m
```

### R-5.13 · v1

Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out.

- test: tests/acceptance/evaluation/R-5.13.spec.ts

**Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out. (a proponent under review has no consensus at all)** — failed

```
Error: proposal 00000000-0000-4000-a011-000000000101 shows no history to compare

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m
```

**Finalising the consensus scores must be refused unless every proponent still under review of the questions has a submitted consensus, so that no proponent is left neither screened in nor screened out. (a proponent under review has a consensus saved as a draft and not submitted)** — failed

```
Error: proposal 00000000-0000-4000-a011-000000000101 shows no history to compare

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m
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
Received string:  [31m"Please select a date on or after Jan 10, 2027."[39m
```

### R-2.16 · v1

A Sprint With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program, and the organization is re-checked at the moment of submission.

- given: a draft Sprint With Us proposal naming an organization that has since lost its qualified status
- when: the vendor submits it
- then: the submission is refused, and a proposal naming no organization at all is refused with "An organization must be specified before submitting."
- test: tests/acceptance/proposals/R-2.16.spec.ts

**a Sprint With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program** — failed

```
Error: proposal-swu-create.add_phase_team_member — refused: the "Organization" chooser on http://localhost:3102/opportunities/sprint-with-us/8d60d5e4-442c-4d4c-9d40-c651a25dcf38/proposals/create has no organization chosen and offers none the test may use, so no team can be put together
```

**the organization a Sprint With Us proposal names is re-checked at the moment of submission** — failed

```
Error: proposal-swu-create.add_phase_team_member — refused: the "Organization" chooser on http://localhost:3102/opportunities/sprint-with-us/50abc89e-eea5-4eb5-9aaa-5addd3ac1e2f/proposals/create has no organization chosen and offers none the test may use, so no team can be put together
```

**a Sprint With Us proposal naming no organization at all is refused** — failed

```
Error: unbound: proposal-swu-create.add_reference — no field labelled "Company Name" or "Reference" on http://localhost:3102/opportunities/sprint-with-us/7d049d4e-86ab-4484-83c7-e8c1f104f04b/proposals/create
```

### R-2.17 · v1

A Team With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program and that provides every service area the opportunity's resources call for.

- given: a Team With Us opportunity calling for a service area the vendor's organization does not provide
- when: the vendor submits a proposal naming that organization
- then: the submission is refused with "The selected organization does not satisfy this opportunity's service areas."
- test: tests/acceptance/proposals/R-2.17.spec.ts

**a Team With Us proposal is refused when its organization does not provide every service area the opportunity's resources call for** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"service areas"[39m
Received string:    [31m""[39m
```

### R-2.20 · v2

A Team With Us proposal must name at least one team member, each with an hourly rate of at least one dollar and each against a resource that exists, though the service does not check that the resource belongs to the opportunity being bid on.

- given: a Team With Us opportunity listing one or more resources
- when: a vendor submits a proposal with no team members, with an hourly rate below one dollar, or naming a resource the opportunity does not list
- then: the submission is refused and the member, the rate or the resource is named as the reason
- test: tests/acceptance/proposals/R-2.20.spec.ts

**a Team With Us proposal must name at least one team member** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-2.22 · v1

Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn.

- given: a submitted Sprint With Us or Team With Us proposal
- when: the vendor edits it and names a different organization
- then: the edit is refused with "Organization cannot be changed once the proposal has been submitted", while the same edit on a draft or withdrawn proposal is accepted
- test: tests/acceptance/proposals/R-2.22.spec.ts

**once a proposal has been submitted, the organization it was submitted for cannot be changed** — failed

```
Error: proposal-twu-edit.save_changes — "Submit Changes" is disabled on http://localhost:3101/opportunities/team-with-us/9d43596e-563d-43b0-8d67-3754915b54d6/proposals/e8f2ac26-0e0b-4041-a854-296861a86477/edit?tab=proposal; the page shows: Please select a resource name
```

**the organization may be changed once the proposal has been withdrawn** — failed

```
Error: proposal-twu-edit.save_changes — "Save Changes" is disabled on http://localhost:3101/opportunities/team-with-us/5a8caf26-dc44-416e-a1d3-6d424a00684b/proposals/efaa345b-96c1-4d02-b88e-731cb17e0667/edit; the page shows: Please select a resource name
```

### R-2.31 · v1

A proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated.

- given: an opportunity whose questions, challenge, scenario and price carry stated weights
- when: a proposal has a score for every one of those stages
- then: its total is those scores combined in the stated proportions, and it takes a rank among the other fully evaluated proposals, highest total first
- test: tests/acceptance/proposals/R-2.31.spec.ts

**A proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated.** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m1[39m
Received: [31mNaN[39m

Call Log:
- Timeout 30000ms exceeded while waiting on the predicate
```

### R-2.35 · v1

Every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given.

- given: a proposal that has been submitted, reviewed and scored
- when: someone entitled to see its history opens it
- then: the history lists each state change and each score entry, newest first, each with its author, its time and its note
- test: tests/acceptance/proposals/R-2.35.spec.ts

**every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given** — failed

```
Error: the administrator named as the author of both new entries

[2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThanOrEqual[2m([22m[32mexpected[39m[2m)[22m

Expected: >= [32m2[39m
Received:    [31m0[39m
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

### R-4.3 · v1

A vendor cannot finish signing up until they confirm they have read and agree to the service's terms and conditions and its privacy policy; a public sector employee is never asked to, and the moment of acceptance is recorded on the vendor's account.

- given: a vendor on the profile-completion page with the agreement box unticked
- when: they try to complete their profile
- then: the completion control is unavailable until they tick the box, and once they complete it their account records the date and time they agreed
- test: tests/acceptance/users/R-4.3.spec.ts

**a vendor cannot finish signing up until they confirm they have read and agree to the service's terms and conditions and its privacy policy** — failed

```
Error: unbound: user-sign-up-complete.terms_checkbox — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

**the moment of acceptance is recorded on the vendor's account** — failed

```
Error: unbound: user-sign-up-complete.accept_app_terms — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

**a public sector employee is never asked to agree to the terms** — failed

```
Error: unbound: user-sign-up-complete.terms_checkbox — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

### R-4.4 · v1

A person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in.

- given: an account an administrator has deactivated
- when: that person signs in through the identity provider
- then: no session is created and they are shown a page saying sign-in failed and inviting them to try again
- test: tests/acceptance/users/R-4.4.spec.ts

**a person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in** — failed

```
Error: unbound: signIn.deactivated-vendor — the session route mints a session without checking account status, so it cannot show the identity provider's refusal of this account (status: INACTIVE_ADMIN)
```

### R-2.7 · v2

A proposal may be created only as a draft or as a submission, in all three programs; any other state is refused.

- given: the published description of the proposal interface
- when: it is compared with what the service accepts
- then: three disagreements appear, and in each the running service is the stricter of the two
- test: tests/acceptance/proposals/R-2.7.spec.ts

**a proposal may be created as a draft, in all three programs** — failed

```
Error: unbound: proposal-swu-create.add_reference — no field labelled "Company Name" or "Reference" on http://localhost:3101/opportunities/sprint-with-us/894e4dd1-0d49-4584-9400-837bd05f1123/proposals/create
```

**a proposal may be created as a submission, in all three programs** — failed

```
Error: unbound: proposal-swu-create.add_reference — no field labelled "Company Name" or "Reference" on http://localhost:3101/opportunities/sprint-with-us/2ec4d737-d631-4266-b86d-4c21a12f9e8e/proposals/create
```

### R-2.9 · v1

A vendor may read the history of a proposal they authored, or of a proposal belonging to an organization they own or administer, in all three programs.

- test: tests/acceptance/proposals/R-2.9.spec.ts

**a vendor may read the history of a proposal they authored, in all three programs** — failed

```
Error: unbound: proposal-swu-create.add_reference — no field labelled "Company Name" or "Reference" on http://localhost:3100/opportunities/sprint-with-us/83d4cdff-4bd0-4966-be5b-8098a14dbb31/proposals/create
```

**a vendor may read the history of a proposal belonging to an organization they own or administer, in all three programs** — failed

```
Error: unbound: proposal-swu-create.add_reference — no field labelled "Company Name" or "Reference" on http://localhost:3100/opportunities/sprint-with-us/47a52a9c-74bc-4a0f-93ce-81e1e87b1b71/proposals/create
```

### R-2.11 · v1

An organization may appear on at most one proposal per opportunity, and a proposal naming an organization that already bid is refused with a pointer to the existing proposal.

- given: an opportunity that already carries a proposal naming a given organization
- when: a different vendor who administers that same organization names it on a new proposal, or an existing proposal is edited to name it
- then: the request is refused with "Please select a different organization." and the identifier of the existing proposal is returned alongside the refusal
- test: tests/acceptance/proposals/R-2.11.spec.ts

**an organization may appear on at most one proposal per opportunity, and a proposal naming an organization that already bid is refused** — failed

```
Error: unbound: proposal-swu-create.add_reference — no field labelled "Company Name" or "Reference" on http://localhost:3101/opportunities/sprint-with-us/9f4b5b16-6dbb-43e2-b24e-e521d517f63c/proposals/create
```

### R-4.14 · v1

An administrator can browse everyone registered with the service, listed by status, then account kind, then name, showing each person's status, account kind, name and whether they are an administrator, and can narrow the list by typing part of a name.

- given: an active vendor, a deactivated vendor and a public sector employee registered with the service
- when: an administrator opens the list of users and then types part of one person's name
- then: all three are listed with the active accounts before the inactive ones, and the list narrows to the people whose names match what was typed
- test: tests/acceptance/users/R-4.14.spec.ts

**an administrator can browse everyone registered with the service, showing each person's status, account kind, name and whether they are an administrator** — failed

```
Error: unbound: user-list.admin_check — the Admin? column shows an unlabelled tick with no accessible name or text, and the list's rows are drawn as one flattened block, so there is nothing on the page to read the mark from
```

### R-2.19 · v2

A Sprint With Us proposal must offer a team for every phase the opportunity requires and no phase it does not, name no more than one scrum master in each phase, cover every capability the opportunity requires across its phases, and stay within each phase's budget and the opportunity's total budget.

- given: a Sprint With Us opportunity with an inception phase and a set of required capabilities
- when: a vendor submits a proposal that omits the inception phase, names two scrum masters, leaves a required capability uncovered, or proposes a total cost above the opportunity's maximum budget
- then: each of those submissions is refused, naming the phase, the team or the cost as the reason
- test: tests/acceptance/proposals/R-2.19.spec.ts

**a Sprint With Us proposal must offer a team for every phase the opportunity requires** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3100/opportunities/sprint-with-us/create
```

**a Sprint With Us proposal must offer no phase the opportunity does not require** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3100/opportunities/sprint-with-us/create
```

**a Sprint With Us proposal may name no more than one scrum master in each phase** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3100/opportunities/sprint-with-us/create
```

**a Sprint With Us proposal must cover every capability the opportunity requires across its phases** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3100/opportunities/sprint-with-us/create
```

**a Sprint With Us proposal must stay within each phase's budget** — failed

```
Error: unbound: no opportunity identifier in the address http://localhost:3100/opportunities/sprint-with-us/create
```

### R-2.21 · v1

A response to an opportunity question is rejected if it is empty or longer than the word limit that question carries, or if it answers a question the opportunity does not ask.

- given: an opportunity question carrying a word limit
- when: a vendor submits a response that is empty, that exceeds the word limit, or that is numbered against no question of the opportunity
- then: the submission is rejected with "No matching opportunity question." or with the word-limit error against that response
- test: tests/acceptance/proposals/R-2.21.spec.ts

**a response to an opportunity question is rejected if it is empty** — failed

```
Error: unbound: proposal-swu-create.add_reference — no field labelled "Company Name" or "Reference" on http://localhost:3102/opportunities/sprint-with-us/3b90b188-9779-4f3d-a0fd-14e830c94690/proposals/create
```

**a response to an opportunity question is rejected if it is longer than the word limit that question carries** — failed

```
Error: unbound: proposal-swu-create.add_reference — no field labelled "Company Name" or "Reference" on http://localhost:3102/opportunities/sprint-with-us/0c0c4ee0-0648-46f4-9daa-4905a0301b19/proposals/create
```

### R-4.23 · v2

The profile-completion page is offered only to a vendor who has not yet agreed to the terms; a vendor who has agreed before and any signed-in person who is not a vendor are sent to their dashboard instead, and a visitor who is not signed in is sent to sign in.

- given: a public sector employee signing in for the first time, and a vendor who has already agreed to the terms once
- when: each is sent to the profile-completion page
- then: both are moved straight on to their dashboard without being asked to confirm anything
- test: tests/acceptance/users/R-4.23.spec.ts

**the profile-completion page is offered to a vendor who has not yet agreed to the terms** — failed

```
Error: unbound: user-sign-up-complete.terms_checkbox — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

**a vendor who has agreed before is sent to their dashboard instead** — failed

```
Error: unbound: user-sign-up-complete.terms_checkbox — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

**any signed-in person who is not a vendor is sent to their dashboard instead** — failed

```
Error: unbound: user-sign-up-complete.terms_checkbox — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

**a visitor who is not signed in is sent to sign in** — failed

```
Error: unbound: user-sign-up-complete.terms_checkbox — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

### R-4.24 · v1

While completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account.

- given: a vendor completing their profile
- when: they tick the box offering notice of new opportunities and complete the profile
- then: their account records that notifications are on, with the moment the choice was made
- test: tests/acceptance/users/R-4.24.spec.ts

**while completing their profile a person may choose to be told about new opportunities, and the choice is saved with their account** — failed

```
Error: unbound: user-sign-up-complete.toggle_new_opportunity_notifications — /sign-up/complete never shows the profile form on this target; it redirects to /sign-in when signed out and to /dashboard when signed in — looked again signed in through /auth/createsessionadmin, /auth/createsessiongov and every /auth/createsessionvendor/1 to 16 (17 and above fail with /notice/authFailure), and each lands on /dashboard, so no route reaches an account with an unfinished profile; the first-time personas this form is for have no sign-in on this target
```

### R-2.28 · v1

Sprint With Us and Team With Us proposals advance through the evaluation stages one at a time, and an action taken at the wrong stage of the opportunity is refused.

- given: a Sprint With Us opportunity still in its code challenge stage
- when: someone enters a team scenario score for one of its proposals
- then: the request is refused with "The opportunity is not in the correct stage of evaluation to perform that action."
- test: tests/acceptance/proposals/R-2.28.spec.ts

**a Sprint With Us action taken at the wrong stage of the opportunity is refused** — failed

```
Error: unbound: proposal-swu-view.screen_in_to_team_scenario — no control labelled "Screen In" or "Screen In to Team Scenario" on http://localhost:3100/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/proposals/00000000-0000-4000-8000-000000000741
```

**a Team With Us action taken at the wrong stage of the opportunity is refused** — failed

```
Error: unbound: proposal-twu-view.screen_in_to_challenge — no control labelled "Screen In" or "Screen In to Challenge" on http://localhost:3100/opportunities/team-with-us/00000000-0000-4000-8000-000000000801/proposals/00000000-0000-4000-8000-000000000841
```

### R-1.33 · v1

An administrator or an opportunity's author may attach a private note, with files, to a Code With Us or Sprint With Us opportunity's history at any point in its life.

- given: a Code With Us or Sprint With Us opportunity in any state
- when: its author adds a note of up to 1,000 characters with attachments
- then: the note and its attachments appear in the opportunity's history, which only the author and administrators can see
- test: tests/acceptance/opportunities/R-1.33.spec.ts

**an opportunity's author may attach a private note to a Code With Us opportunity's history** — failed

```
Error: unbound: opportunity-cwu-edit.add_note — signed in as the administrator and looked on the seeded published, open and processing opportunities of both programmes: the History tab is a table (Entry Type | Note | Created) with nothing in its top bar, the Opportunity tab's Actions menu offers only "Edit" and "Cancel", the Addenda tab only "Add Addendum", and no screen offers a way to add a note. Looked again as the administrator on the seeded published Code With Us opportunity, the seeded one in processing and a freshly published Sprint With Us one: the History tab's top bar is empty and its table has no control. The service's update request does take an "addNote" change, but nothing on any screen sends one, so there is no control for this action to press
```

**an administrator may attach a private note to a Sprint With Us opportunity's history** — failed

```
Error: unbound: opportunity-swu-edit.add_note — signed in as the administrator and looked on the seeded published, open and processing opportunities of both programmes: the History tab is a table (Entry Type | Note | Created) with nothing in its top bar, the Opportunity tab's Actions menu offers only "Edit" and "Cancel", the Addenda tab only "Add Addendum", and no screen offers a way to add a note. Looked again as the administrator on the seeded published Code With Us opportunity, the seeded one in processing and a freshly published Sprint With Us one: the History tab's top bar is empty and its table has no control. The service's update request does take an "addNote" change, but nothing on any screen sends one, so there is no control for this action to press
```

### R-2.37 · v1

Anyone entitled to read a proposal can take away a printable copy of it, and staff reading a Sprint With Us or Team With Us copy see the anonymous proponent name until the proposal reaches the challenge stage.

- given: a Sprint With Us proposal under review on its team questions
- when: the opportunity's author opens its printable copy, and then the vendor who wrote it opens the same copy
- then: the staff copy names the proponent only as "Proponent 1" while the vendor's own copy names the organization, and once the proposal reaches the code challenge the staff copy names the organization too
- test: tests/acceptance/proposals/R-2.37.spec.ts

**the vendor's own copy of a Sprint With Us proposal names the organization** — failed

```
Error: unbound: proposal-swu-create.add_reference — no field labelled "Company Name" or "Reference" on http://localhost:3100/opportunities/sprint-with-us/5b086c5b-2745-4c62-82a0-a5f6366b65ea/proposals/create
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

The question is which of the 23 criteria that failed or stayed unbound against the old target this project's own adapter caused. Approve, with one triage condition per criterion. The adapter is at fault in six places. (1) proposal-swu-create.add_reference never opens the Sprint With Us form's 'References' tab. That tab holds three references, 'Reference 1' to 'Reference 3', each with Name, Company, Phone and Email fields. The adapter instead looks for a 'Company Name' field that does not exist and types the whole input as text into one box, which fails R-2.7, R-2.9, R-2.11, R-2.21, R-2.37 and the third R-2.16 test. (2) The fill-in-required-fields step that runs before a disabled Submit picks a 'Resource Name' and types an 'Hourly Rate' the R-2.20 test deliberately left empty. (3) The history reader takes the author cell's innerText, which the page uppercases with CSS, so it never matches the administrator's name (R-2.35). (4) The users list is a scrolling grid whose Admin? cell holds an icon element or nothing, which the adapter could read by its presence in each row (R-4.14). (5) For R-4.23 the adapter saw the redirects the criterion describes and reported them as unbound instead of passing them to the test. (6) Publishing a valid Prototype plus Implementation opportunity for R-2.19 left the page on /create and the adapter read an identifier from that address. R-4.4 is oracle-cannot: in the old source the deactivated-account refusal happens only in the identity provider's sign-in callback, and /auth/createsessionvendor mints a session and redirects to /dashboard with no status check. Everything else carries no evidence against the adapter and goes to the product owner. For R-4.3 and R-4.24 the missing state is a seeded vendor with no acceptedTermsAt. The seed schema carries that column, so this is a seed gap rather than something the oracle cannot reach; it belongs to contract, and the triage format cannot address it there. This ruling would change if a rebinding run fixes the references and fill-in faults and those criteria still fail (they then stay with the product owner), or if the session route is shown to check account status (R-4.4 then becomes adapter-wrong).

**Conditions:**
- product-question R-1.9
- product-question R-2.10
- product-question R-5.13
- product-question R-1.16
- adapter-wrong R-2.16: proposal-swu-create.add_reference neither opens the form's 'References' tab nor maps its input: the tab holds three blocks headed 'Reference 1' to 'Reference 3', each with fields labelled Name, Company, Phone and Email, and the input's order, name, company, phone and email must go into those fields instead of the whole object being typed as text into a field labelled 'Company Name' or 'Reference', which does not exist. Also, when chooseOrganization has left the organization withheld, proposal-swu-create.add_phase_team_member throws 'refused' instead of returning with no team added, as the Team With Us binding does, so the test never gets to read the refusal
- adapter-wrong R-2.20: before a disabled Submit, the fill-in-required-fields step picks a 'Resource Name*' option and types a placeholder 'Hourly Rate*' on the Team With Us proposal form even though the test never named a team member, so a proposal the test submitted with no team member goes through with one and no refusal is shown; team-member choosers and hourly rates must never be filled on the test's behalf
- adapter-wrong R-2.35: proposal-swu-view.history_tab reads the Created cell with innerText, which returns the author's name uppercased by the page's CSS text-uppercase class ('BLAKE PLACEHOLDER'); read the name's own text (textContent) so it matches the name the user profile shows
- product-question R-2.17
- product-question R-2.22
- product-question R-2.31
- oracle-cannot R-4.4: a deactivated account is refused only in the identity provider's sign-in callback, which redirects INACTIVE_ADMIN users to /notice/authFailure; this target's only sign-in is /auth/createsessionvendor/:id, which creates a session for any existing account and redirects to /dashboard without checking its status, so the refusal cannot be exercised without the external identity provider
- adapter-wrong R-2.7: proposal-swu-create.add_reference neither opens the 'References' tab nor maps its input: fill Name, Company, Phone and Email under 'Reference N' (N = order + 1) from the input's name, company, phone and email, instead of looking for a field labelled 'Company Name' or 'Reference', which does not exist
- adapter-wrong R-2.9: proposal-swu-create.add_reference neither opens the 'References' tab nor maps its input: fill Name, Company, Phone and Email under 'Reference N' (N = order + 1) from the input's name, company, phone and email, instead of looking for a field labelled 'Company Name' or 'Reference', which does not exist
- adapter-wrong R-2.11: proposal-swu-create.add_reference neither opens the 'References' tab nor maps its input: fill Name, Company, Phone and Email under 'Reference N' (N = order + 1) from the input's name, company, phone and email, instead of looking for a field labelled 'Company Name' or 'Reference', which does not exist
- adapter-wrong R-4.14: user-list.admin_check reports nothing to read, but the list is a scrolling grid of positioned blocks whose Admin? cell holds a tick icon element when the user is an administrator and nothing otherwise; locate each row by its name cell and read the mark as the presence of that icon in the row's last cell instead of by accessible name or text
- adapter-wrong R-2.19: publishing a Sprint With Us opportunity whose phases are Prototype (28 to 60 days out) and Implementation (61 to 90 days out) left the page on /opportunities/sprint-with-us/create, and the adapter then read the opportunity identifier from that address; the publish must set the start-phase chooser to Prototype, enter each phase's dates exactly as given without adding dates of its own, and report the page's own refusal when publish does not land on a record
- product-question R-2.21
- adapter-wrong R-4.23: user-sign-up-complete.terms_checkbox throws unbound although the adapter itself saw what three of this criterion's clauses ask about, namely that /sign-up/complete redirects to /sign-in when signed out and to /dashboard for the administrator, the public sector employee and every seeded vendor who has agreed; for those personas report that no agreement box is offered, and where the person was sent, instead of throwing
- product-question R-4.3
- product-question R-4.24
- product-question R-2.28
- product-question R-1.33
- adapter-wrong R-2.37: proposal-swu-create.add_reference neither opens the 'References' tab nor maps its input: fill Name, Company, Phone and Email under 'Reference N' (N = order + 1) from the input's name, company, phone and email, instead of looking for a field labelled 'Company Name' or 'Reference', which does not exist
