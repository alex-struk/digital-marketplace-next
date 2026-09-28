| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-28T23:40:34.936Z |
| holder | agent:product-owner |

# 12 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-4.3, R-1.9, R-2.10, R-5.13, R-1.16, R-2.17, R-2.21, R-2.22, R-4.24, R-2.28, R-2.31, R-1.33 with a calibration condition, so the next calibrate run can apply it.

12 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
The tests are blind: they were written from the criteria alone, by an agent that never saw the
application. So a failure means one of exactly three things, and only you can say which:
the application is wrong, the criterion is wrong, or the test is wrong.

Rule on each one below. Until every failure carries a ruling, this question is asked again on
every calibration run.

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

Question: for each of the 12 criteria that failed against the old application, is the fault in the application, the criterion or the test? Ruling: approve, with one condition per criterion. Two are the old application's fault. R-2.10: the old Team With Us proposal flow never calls its budget check — validateTWUProposalProposedCost is defined in shared/lib/validation/proposal/team-with-us.ts and has no caller, while Sprint With Us enforces its own — so the criterion stands and the rebuild must enforce it. R-1.9: the old application stores the fourteen-day default at midnight UTC, which a Pacific user sees as the previous day ('Closed Oct 11, 2026 at 4:00 PM PDT' when saved on Sept 28), and on Team With Us it sets an invalid completion date to the default where Code With Us leaves it null (team-with-us/index.ts:388 against code-with-us.ts:272). The criterion describes the right behaviour, so both are recorded as old defects. R-1.33 is spec-wrong: the service accepts an addNote change, but no screen in the old front-end sends one (a search of the front-end for addNote finds nothing), so the criterion is restated as a capability of the service with no screen offering it; whether the rebuild adds a screen is a product decision for later. The other nine are test failures. In every one the old code enforces the rule (the prototype-after-inception check, the service-area refusal on create, edit and submit, the locked organization on submitted proposals, the wrong-stage refusal in both programmes) or the test stopped before reaching it: phase dates refused first, a resource name missing, reference fields unrelated to question responses, a control that is not offered, proposal history or rank not found. R-4.3 and R-4.24 cannot be reached because no sign-in route leads to a vendor with an unfinished profile. Redoing those two tests will not fix that on its own: the seed needs a first-time vendor persona, and if they come back unbound again this should go to the tech lead rather than back to this persona. What would change this ruling: evidence that a date stored at midnight UTC is intended (R-1.9 would become spec-wrong); a call site for validateTWUProposalProposedCost that this search missed (R-2.10 would become test-wrong); or a screen in the old application that adds a note to an opportunity's history (R-1.33 would become test-wrong).

**Conditions:**
- defect-in-old R-2.10
- defect-in-old R-1.9
- spec-wrong R-1.33: The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one.
- test-wrong R-4.3: the test needs a vendor who has not yet completed their profile and signs in as an established vendor instead, so it never reaches the agreement step; it must begin as a first-time vendor persona.
- test-wrong R-4.24: the test needs a person who has not yet completed their profile and signs in as an established account instead, so it never reaches the profile-completion step; it must begin as a first-time persona.
- test-wrong R-1.16: the opportunity the test submits is refused over its phase dates before the phase rule is reached; everything except the missing prototype phase must be valid, so that the prototype-phase message is the only fault.
- test-wrong R-2.22: the proposal the test edits is incomplete in other ways, so the change cannot be saved at all; the proposal must be otherwise complete so that the organization change is the only thing under test, both when refused and when accepted.
- test-wrong R-2.21: the test depends on filling in parts of the proposal that the criterion does not mention before it reaches the question responses; it should vary only the response to an opportunity question and observe that response's rejection.
- test-wrong R-2.17: the test observed no outcome at all rather than an acceptance; it must first confirm that the proposal names the organization lacking the service area and is actually submitted, then read the refusal.
- test-wrong R-2.28: the test depends on a control being offered at a stage where the action is out of place; it should observe the refusal of the out-of-stage action itself, and not treat the action's absence from the screen as a failure.
- test-wrong R-5.13: the test fails while reading a proposal's history, which the criterion does not mention, before it ever attempts to finalise; it should attempt finalisation with a proponent lacking a submitted consensus and observe the refusal.
- test-wrong R-2.31: the test timed out reading a rank it could not parse as a number; it should read the total and rank for fully evaluated proposals where they are presented, and set up every stage score before reading.
