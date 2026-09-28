| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-28T19:06:43.210Z |
| holder | agent:product-owner |

# 10 criterion(s) fail against old: which of them is the application's fault, which the spec's, and which the test's?

**Recommendation.** Rule on R-6.1, R-8.2, R-8.5, R-8.7, R-1.9, R-8.12, R-5.14, R-2.18, R-5.30, R-5.32 with a calibration condition, so the next calibrate run can apply it.

10 criterion(s) failed against the **old** target at http://localhost:4300, with no ruling yet.
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

```
no result recorded
```

### R-8.2 · v1

An upload carries the file itself, a name to store it under, and a statement of who may read it, all in one submission.

- given: a signed-in person with a document to upload
- when: they submit the document together with a name and a read-access statement
- then: the file is stored and its record — its identifier, its name and the date it was stored — is returned
- test: tests/acceptance/files/R-8.2.spec.ts

**an upload carries the file itself, a name to store it under, and a statement of who may read it, all in one submission** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-8.5 · v1

Two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access.

- given: a file already stored by one person
- when: a second person uploads a file with byte-for-byte identical content under a different name
- then: a second, separate record is created that shares the stored content, and the second person's read access does not extend to the first record
- test: tests/acceptance/files/R-8.5.spec.ts

**two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-8.7 · v1

A file is readable by anyone if it was marked readable by anyone, by a person it names, by anyone holding an account type it names, by whoever uploaded it, and by any administrator.

- given: a file uploaded by one vendor and marked readable by no one else
- when: a second vendor asks for it, and then an administrator asks for it
- then: the second vendor is refused and the administrator receives it
- test: tests/acceptance/files/R-8.7.spec.ts

**a file marked readable by no one else is readable by whoever uploaded it and by any administrator, and refused to another vendor** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-1.9 · v2

An opportunity saved as a draft is accepted with incomplete content; when its proposal deadline, assignment date or start date is missing or invalid it is set to fourteen days from the day of saving, and its completion date is left empty.

- given: a member of public sector staff filling in a new opportunity
- when: they save it as a draft with fields still blank
- then: the draft is stored, no content validation error is raised, and absent dates are set to fourteen days from the day of saving
- test: tests/acceptance/opportunities/R-1.9.spec.ts

**a draft whose proposal deadline is missing is given one fourteen days from the day of saving** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"12"[39m
Received string:    [31m"Closed Oct 11, 2026 at 4:00 PM PDT"[39m
```

### R-8.12 · v1

A request for a file the requester may not read is answered as not authorized, and so is a request for a file that does not exist — unless the requester is an administrator, who is told it was not found.

- given: an identifier that no stored file carries
- when: a vendor asks for it, and then an administrator asks for it
- then: the vendor is told they are not authorized and the administrator is told it was not found
- test: tests/acceptance/files/R-8.12.spec.ts

**a request for a file the requester may not read is answered as not authorized** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

### R-5.14 · v1

The action that finalises consensus scores must be offered to whoever the service accepts it from — the opportunity's owner as well as an administrator — so that the browser and the service agree on who may finalise.

- test: tests/acceptance/evaluation/R-5.14.spec.ts

**the action that finalises consensus scores is offered to the opportunity's owner** — failed

```
Error: evaluation-consensus-list-swu.finalize_consensus_scores — refused: the opportunity is at "Team Questions Consensus" but the top bar of http://localhost:3101/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=consensus offers this reader no "Finalize Consensus Scores" or "Finalize Scores" or "Finalize" (it shows: Digital Marketplace | staff.one@example.test | Dashboard | | | Opportunities | | | Organizations)
```

### R-2.18 · v2

Every person named on a proposal's team must be an active member of the organization the proposal is submitted for, refused with "User is not an active member of the organization.", and a Team With Us proposal additionally refuses the same person named twice with "Please select unique team members.", while a Sprint With Us phase applies no such uniqueness check.

- given: a proposal naming a person whose membership of the organization is pending, inactive or absent
- when: the vendor submits it
- then: the submission is refused with "User is not an active member of the organization.", and naming the same person twice is refused with "Please select unique team members."
- test: tests/acceptance/proposals/R-2.18.spec.ts

**every person named on a proposal's team must be an active member of the organization the proposal is submitted for** — failed

```
Error: proposal-swu-create.add_phase_team_member — refused: {"id":"00000000-0000-4000-8000-000000000201","persona":"vendor","idp_id":"test-vendor-1","email":"vendor.one@example.test","account_type":"VENDOR"} is not a member of any organization the signed-in vendor belongs to, so no team picker on http://localhost:3100/opportunities/sprint-with-us/a3dc854d-f8dd-4ab0-89b5-e26b22523e5d/proposals/create offers them
```

**a Team With Us proposal refuses the same person named twice** — failed

```
Error: proposal-twu-create.add_team_member_for_resource — refused: the "Resource Name" chooser does not offer "Charlie Placeholder" on http://localhost:3100/opportunities/team-with-us/819d0baa-c05f-417b-91fb-6372927cf494/proposals/create (it offers: Blake Placeholder | Dana Placeholder)
```

**a Sprint With Us phase applies no uniqueness check to the people named on it** — failed

```
Error: proposal-swu-create.add_phase_team_member — refused: the member dialog does not offer "Charlie Placeholder" on http://localhost:3100/opportunities/sprint-with-us/179d1e96-822b-4b9f-9a86-460b384485a7/proposals/create (it shows: Add Team Member(s) | Select the team member(s) that you want to propose to be part of your team for this opportunity. If you do not see the team member that you want to add, you must send them a request to join your organization. | Blake Placeholder | Dana Placeholder | Add Team Member(s) | Cancel)
```

### R-5.30 · v1

The chair may reopen and resubmit a consensus as often as they like until it is finalised, unlike an individual evaluation, which is fixed once submitted.

- given: a consensus the chair has already submitted, on an opportunity still in consensus
- when: the chair changes an agreed score and submits again
- then: the change is accepted and the consensus is recorded as submitted afresh
- test: tests/acceptance/evaluation/R-5.30.spec.ts

**the chair may reopen and resubmit a consensus until it is finalised** — failed

```
Error: evaluation-consensus-list-twu.submit_final_consensus_scores — refused: the top bar of http://localhost:3101/opportunities/team-with-us/00000000-0000-4000-8000-000000000801/edit?tab=consensus offers "Finalize Consensus Scores" instead of "Submit Final Consensus Scores" (no consensus left in draft; it shows: Digital Marketplace | admin.one@example.test | Dashboard | | | Opportunities | | | Organizations | | | Users | | | Content | Finalize Consensus Scores)
```

### R-5.32 · v1

Finalising the consensus records the agreed scores against each proponent, screens in the highest-scoring proponents that met every minimum score — at most four for Sprint With Us and at most three for Team With Us — and moves the opportunity to its next stage.

- given: a Sprint With Us opportunity in consensus with six proponents, five of whom met every minimum score
- when: the consensus scores are finalised
- then: every proponent's history records the agreed scores question by question, the four highest scoring of the five are moved into the code challenge, and the opportunity moves to the code challenge stage
- test: tests/acceptance/evaluation/R-5.32.spec.ts

**finalising records the agreed scores, screens in the proponents that met every minimum, and moves the opportunity on** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"challenge"[39m
Received string:    [31m"under review"[39m
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
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question was, for each of the ten criteria failing against the old application, whether the application, the criterion or the test is at fault. Ruling: approve, with one calibration condition per criterion, checked against the old source and the reviewer's triage. R-5.14 is defect-in-old: it was written as the replacement for R-5.8, a defect recorded against the old application, where the service accepts finalising from the opportunity's owner but the browser offers the action only to an administrator. The old application failing it is the expected result, and the rebuild must pass it. R-5.30 is spec-wrong: in the old application, updating a consensus writes the new scores and notes and changes nothing else (the Team With Us resource-question evaluation update in the back end), so a consensus the chair edits after submitting stays submitted and no second submission exists, which is why the page offered Finalize rather than Submit. R-2.18 is spec-wrong: the service rules and their messages stand, but in the run the browser offered only the organization's active members, and after a person was named it did not offer them again, in either the Team With Us resource chooser or the Sprint With Us member dialog. The criterion as worded implies a person can be named twice through the form, which the old application never allows, so the new wording states what the browser withholds. The browser's withholding is graded from one run on each program. The service's refusals keep their recovered grading, which this ruling does not change. R-1.9 is test-wrong: the old back end sets a missing deadline to fourteen days from the moment of saving, keeping the time of day. The deadline shown (Oct 11, 4:00 PM PDT, which is 23:00 UTC) is exactly fourteen days from a save made at that time, and the test computed the expected day in its own time zone, a day later across midnight UTC. R-5.32 is test-wrong: the reviewer found the opportunity did move to the code challenge, and the failing assertion read a vendor's view of their own proposal, which in the old application shows 'Under Review' at every evaluation stage. R-8.5 is test-wrong because the second uploader's account had been left inactive by earlier runs. R-8.2, R-8.7 and R-8.12 are test-wrong because the upload each test depends on was refused before the criterion's behaviour was reached, while uploads by the same persona through the same binding were accepted in R-8.1 and R-8.6 in the same run, and the harness discarded the refusal's status and body. R-6.1 is test-wrong because it was skipped, not failed: the run never provided the notifications-off configuration it requires. For these five (R-6.1 and the four files criteria), the fault lies mostly in the harness and the run's account state rather than in the test's reading of the criterion. test-wrong is the nearest honest verb, and defect-in-old would falsely record that the old application cannot store uploads. The harness should capture a refused upload's status and body, reset persona accounts between runs, and start one instance with notifications disabled. What would change this ruling: a rerun with those harness faults fixed that still fails any of the five at the same assertion, with the refusal text captured, makes it a genuine product question. A read of the old front end showing the Sprint With Us member dialog does offer an already-named person would return R-2.18's browser clause to test-wrong.

**Conditions:**
- defect-in-old R-5.14
- spec-wrong R-5.30: The chair may change the agreed scores of a consensus they have already submitted, as often as they like until it is finalised; each change is saved directly and the consensus stays submitted, with no second submission, unlike an individual evaluation, which is fixed once submitted.
- spec-wrong R-2.18: Every person named on a proposal's team must be an active member of the organization the proposal is submitted for, and the service refuses anyone else with "User is not an active member of the organization."; a Team With Us proposal is additionally refused by the service when the same person is named twice, with "Please select unique team members.", while the service applies no such uniqueness check to a Sprint With Us phase. The proposal form offers only the organization's active members, and does not offer a person already named on the proposal, so neither refusal is reachable through the form.
- test-wrong R-1.9: it computes 'fourteen days from the day of saving' in the test runner's own time zone, but the deadline is shown in Pacific time, so near midnight UTC the day of the month differs by one; the expected day must be taken in the time zone the deadline is displayed in
- test-wrong R-5.32: it reads whether a proponent was screened into the code challenge from the vendor's own view of their proposal, which shows 'Under Review' at every evaluation stage and never names the stage; screening must be read from a view that names the proposal's stage
- test-wrong R-8.5: the second upload is made by a vendor account that is no longer active, so it is refused before the criterion is reached; the second uploader must be an active account able to upload
- test-wrong R-8.2: it reads an empty file identifier from an upload the service refused before the criterion's behaviour was reached, while uploads by the same persona were accepted elsewhere in the run; the test must start from an account able to upload and report the refusal it received instead of reading an empty identifier
- test-wrong R-8.7: its first upload was refused before any read access was tested, while uploads by the same persona were accepted elsewhere in the run; the test must start from an account able to upload and report the refusal it received instead of reading an empty identifier
- test-wrong R-8.12: its upload of a file the vendor may not read was refused before the vendor's request was made, while uploads by the same persona were accepted elsewhere in the run; the test must start from an account able to upload and report the refusal it received instead of reading an empty identifier
- test-wrong R-6.1: it recorded no result because it skips itself unless the run supplies a notifications-off configuration, which the calibration run never supplied; the test must run against an instance started with notifications switched off
