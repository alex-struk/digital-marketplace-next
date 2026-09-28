---
gate: G3
question: "17 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-8.2, R-2.4, R-8.5, R-8.7, R-2.10, R-8.12, R-5.14, R-5.16, R-2.17, R-2.18, R-2.20, R-8.20, R-2.22, R-2.28, R-5.30, R-2.31, R-5.32 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-28T18:56:12.369Z
---

# 17 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-8.2, R-2.4, R-8.5, R-8.7, R-2.10, R-8.12, R-5.14, R-5.16, R-2.17, R-2.18, R-2.20, R-8.20, R-2.22, R-2.28, R-5.30, R-2.31, R-5.32 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

17 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

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

### R-2.4 · v1

Only a draft proposal can be deleted, and deleting it removes it permanently.

- given: a proposal that has been submitted
- when: its author asks for it to be deleted
- then: the request is refused, whereas deleting a draft succeeds and the proposal can no longer be opened
- test: tests/acceptance/proposals/R-2.4.spec.ts

**a proposal that has been submitted cannot be deleted** — failed

```
Error: proposal-cwu-edit.delete_proposal — refused: the proposal's status is "Submitted" and its page offers no "Delete" on http://localhost:4300/opportunities/code-with-us/a9de2bd7-8393-4137-9a07-ccec64481e9b/proposals/d56b64a2-a2df-48c3-8a5c-2848e4d323ff/edit; proposal-cwu-edit.delete_proposal — neither the top bar nor an "Actions" menu offers "Delete" on http://localhost:4300/opportunities/code-with-us/a9de2bd7-8393-4137-9a07-ccec64481e9b/proposals/d56b64a2-a2df-48c3-8a5c-2848e4d323ff/edit; the top bar shows: Digital Marketplace | vendor.one@example.test | Dashboard | | | Opportunities | | | Organizations | Edit | Withdraw
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
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByRole('navigation').first().getByText('Save Draft', { exact: true }).visible().first()[22m
[2m    - locator resolved to <a tabindex="0" class="a d-inline-flex align-items-center flex-nowrap text-nowrap ms-3   position-relative btn btn-sm btn-success">…</a>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is visible, enabled and stable[22m
[2m      - scrolling into view if needed[22m
[2m      - done scrolling[22m
[2m      - <div role="dialog" tabindex="-1" aria-modal="true" class="modal fade">…</div> from <div tabindex="-1">…</div> subtree intercepts pointer events[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <div role="dialog" tabindex="-1" aria-modal="true" class="modal fade">…</div> from <div tabindex="-1">…</div> subtree intercepts pointer events[22m
[2m  2 × retrying click action[22m
[2m      - waiting 100ms[22m
[2m      - waiting for element to be visible, enabled and stable[22m
… 14 more line(s)
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

### R-5.16 · v1

The evaluation panel may be set or changed while an opportunity is a draft, under review, published, or in individual question evaluation, and is fixed from the consensus stage onwards.

- given: an opportunity whose questions are being evaluated individually
- when: its owner changes the evaluation panel, and then tries again once the opportunity has moved to consensus
- then: the first change is accepted and the second is refused
- test: tests/acceptance/evaluation/R-5.16.spec.ts

**the evaluation panel is fixed from the consensus stage onwards** — failed

```
Error: evaluation-panel-swu.add_panel_member — refused: the evaluation panel is shown read-only and its top bar offers no "Edit" (Status: Team Questions Consensus) on http://localhost:3100/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/edit?tab=evaluationPanel (the top bar shows: Digital Marketplace | staff.one@example.test | Dashboard | | | Opportunities | | | Organizations)
```

### R-2.17 · v1

A Team With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program and that provides every service area the opportunity's resources call for.

- given: a Team With Us opportunity calling for a service area the vendor's organization does not provide
- when: the vendor submits a proposal naming that organization
- then: the submission is refused with "The selected organization does not satisfy this opportunity's service areas."
- test: tests/acceptance/proposals/R-2.17.spec.ts

**a Team With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program** — failed

```
Error: proposal-twu-create.add_team_member_for_resource — refused: the "Organization" chooser on http://localhost:3102/opportunities/team-with-us/df87c253-6f17-4f7d-bbc7-05c8465c7172/proposals/create offers no organization, so no team can be put together
```

**a Team With Us proposal is refused when its organization does not provide every service area the opportunity's resources call for** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"service areas"[39m
Received string:    [31m""[39m
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

**each team member on a Team With Us proposal carries an hourly rate of at least one dollar** — failed

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
[2m  - waiting for getByText(/^\d+\.\s+\S/).visible().first()[22m
[2m    - locator resolved to <a tabindex="0" class="a d-inline-flex align-items-center flex-nowrap text-body text-hover-body ">4. Review Proposal</a>[22m
[2m  - attempting click action[22m
[2m    2 × waiting for element to be visible, enabled and stable[22m
[2m      - element is not stable[22m
[2m    - retrying click action[22m
[2m    - waiting 20ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is not stable[22m
[2m  - retrying click action[22m
[2m    - waiting 100ms[22m
[2m    - waiting for element to be visible, enabled and stable[22m
[2m    - element is visible, enabled and stable[22m
[2m    - scrolling into view if needed[22m
[2m    - done scrolling[22m
[2m    - <a tabindex="0" target="_blank" href="/content/team-with-us-terms-and-conditions" class="a d-inline-flex align-items-center flex-nowrap ">Team With Us Terms & Conditions</a> from <div tabindex="-1">…</div> subtree intercepts pointer events[22m
[2m  - retrying click action[22m
[2m    - waiting 100ms[22m
… 33 more line(s)
```

### R-8.20 · v1

A file attached to an opportunity or a proposal is readable by whoever may read the thing it is attached to, under one rule covering Code With Us, Sprint With Us and Team With Us alike rather than a separate rule per program.

- test: tests/acceptance/files/R-8.20.spec.ts

**a file attached to a Team With Us opportunity is readable by whoever may read the opportunity, under the same rule** — failed

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

**the organization may be changed once the proposal has been withdrawn** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected substring: [32m"R-2.22 Second Supplier For A Withdrawn Proposal Ltd."[39m
Received string:    [31m"PROPOSAL MANAGEMENT[39m
[31mProposal[39m
[31mVENDOR EVALUATION[39m
[31mScoresheet[39m
[31mNEED HELP?[39m
[31mRead Guide[39m
[31mTeam With Us: R-2.22 opportunity whose withdrawn proposal changes organization[39m
[31mSubmitted Sep 28, 2026[39m
[31m|[39m
[31mUpdated Sep 28, 2026[39m
[31mOpportunity Status[39m
[31mOpen[39m
[31mProposal Status[39m
[31mWithdrawn[39m
[31mOrganization[39m
[31mNorthern Pines Digital Ltd.[39m
[31mExport Proposal[39m
… 12 more line(s)
```

### R-2.28 · v1

Sprint With Us and Team With Us proposals advance through the evaluation stages one at a time, and an action taken at the wrong stage of the opportunity is refused.

- given: a Sprint With Us opportunity still in its code challenge stage
- when: someone enters a team scenario score for one of its proposals
- then: the request is refused with "The opportunity is not in the correct stage of evaluation to perform that action."
- test: tests/acceptance/proposals/R-2.28.spec.ts

**a Sprint With Us action taken at the wrong stage of the opportunity is refused** — failed

```
Error: proposal-swu-view.score_team_scenario — refused: the tab says "If this proposal is screened into the Team Scenario, it can be scored once the opportunity reaches the Team Scenario too." on http://localhost:3101/opportunities/sprint-with-us/00000000-0000-4000-8000-000000000701/proposals/00000000-0000-4000-8000-000000000741?tab=teamScenario
```

**a Team With Us action taken at the wrong stage of the opportunity is refused** — failed

```
Error: proposal-twu-view.score_challenge — refused: the tab says "If this proposal is screened into the Challenge, it can be scored once the opportunity has reached the Challenge too." on http://localhost:3101/opportunities/team-with-us/00000000-0000-4000-8000-000000000801/proposals/00000000-0000-4000-8000-000000000841?tab=challenge
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

### R-2.31 · v1

A proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated.

- given: an opportunity whose questions, challenge, scenario and price carry stated weights
- when: a proposal has a score for every one of those stages
- then: its total is those scores combined in the stated proportions, and it takes a rank among the other fully evaluated proposals, highest total first
- test: tests/acceptance/proposals/R-2.31.spec.ts

**A proposal's total score is the weighted sum of its stage scores, and proposals are ranked against each other only once they are fully evaluated.** — failed

```
Error: the higher bid shows no price score

[2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBeNaN[2m()[22m

Received: [31mNaN[39m
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

## Triage conditions

One condition per line, one for every failing criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.

