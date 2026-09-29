| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-29T05:09:18.952Z |
| holder | agent:reviewer |

# 5 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-8.5, R-2.7, R-2.11, R-2.19, R-2.37 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

5 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-8.5 · v1

Two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access.

- given: a file already stored by one person
- when: a second person uploads a file with byte-for-byte identical content under a different name
- then: a second, separate record is created that shares the stored content, and the second person's read access does not extend to the first record
- test: tests/acceptance/files/R-8.5.spec.ts

**two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access** — failed

```
Error: the upload of "copy-of-report.txt" was not stored: refused for its read-access statement: 503 {"database":["Database error."]}; refused for the length of its name: 503 {"database":["Database error."]}; refused for its size: 503 {"database":["Database error."]}; answered with a fault of the service: 503 {"database":["Database error."]}
```

### R-2.7 · v2

A proposal may be created only as a draft or as a submission, in all three programs; any other state is refused.

- given: the published description of the proposal interface
- when: it is compared with what the service accepts
- then: three disagreements appear, and in each the running service is the stricter of the two
- test: tests/acceptance/proposals/R-2.7.spec.ts

**a proposal may be created as a draft, in all three programs** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a proposal may be created as a submission, in all three programs** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.11 · v1

An organization may appear on at most one proposal per opportunity, and a proposal naming an organization that already bid is refused with a pointer to the existing proposal.

- given: an opportunity that already carries a proposal naming a given organization
- when: a different vendor who administers that same organization names it on a new proposal, or an existing proposal is edited to name it
- then: the request is refused with "Please select a different organization." and the identifier of the existing proposal is returned alongside the refusal
- test: tests/acceptance/proposals/R-2.11.spec.ts

**an organization may appear on at most one proposal per opportunity, and a proposal naming an organization that already bid is refused** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.19 · v2

A Sprint With Us proposal must offer a team for every phase the opportunity requires and no phase it does not, name no more than one scrum master in each phase, cover every capability the opportunity requires across its phases, and stay within each phase's budget and the opportunity's total budget.

- given: a Sprint With Us opportunity with an inception phase and a set of required capabilities
- when: a vendor submits a proposal that omits the inception phase, names two scrum masters, leaves a required capability uncovered, or proposes a total cost above the opportunity's maximum budget
- then: each of those submissions is refused, naming the phase, the team or the cost as the reason
- test: tests/acceptance/proposals/R-2.19.spec.ts

**a Sprint With Us proposal must offer a team for every phase the opportunity requires** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Sprint With Us proposal must offer no phase the opportunity does not require** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Sprint With Us proposal may name no more than one scrum master in each phase** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Sprint With Us proposal must cover every capability the opportunity requires across its phases** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

**a Sprint With Us proposal must stay within each phase's budget** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
```

### R-2.37 · v1

Anyone entitled to read a proposal can take away a printable copy of it, and staff reading a Sprint With Us or Team With Us copy see the anonymous proponent name until the proposal reaches the challenge stage.

- given: a Sprint With Us proposal under review on its team questions
- when: the opportunity's author opens its printable copy, and then the vendor who wrote it opens the same copy
- then: the staff copy names the proponent only as "Proponent 1" while the vendor's own copy names the organization, and once the proposal reaches the code challenge the staff copy names the organization too
- test: tests/acceptance/proposals/R-2.37.spec.ts

**the vendor's own copy of a Sprint With Us proposal names the organization** — timedOut

```
[31mTest timeout of 120000ms exceeded.[39m
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

Question: which of R-8.5, R-2.7, R-2.11, R-2.19 and R-2.37, failing against the old target, did this project's own adapter cause? Ruling: approve, with one triage condition per criterion: four adapter-wrong, one product-question. The evidence is this run's saved snapshots under tests/test-results, read against tests/adapters/old/index.ts. R-8.5 is a product-question: the first upload, through the same binding with the same empty read-access list, was stored. Only the second person's upload of identical bytes was refused, by the service itself, with 503 {"database":["Database error."]}. The test now makes both accounts active before uploading, so the earlier reason (an inactive vendor account) no longer applies, and nothing points at the harness. The four proposal criteria all timed out while the page offered the next control. R-2.7: all three opportunities published and the Code With Us draft or submission succeeded. The Sprint With Us part then stalled on '2. Team'. In the draft test the member (Charlie Placeholder) was already on Implementation with the Scrum Master radio ticked, and the adapter never reached '3. Pricing'. In the submission test add_phase_team_member threw 'no Add Team Member(s) inside Implementation' on a one-phase opportunity whose section is open by default, consistent with openTeamPhases pressing the phase name and folding it. R-2.19: the snapshot shows 'Proof of Concept' unfolded with its 'Add Team Member(s)' visible, and the phase name was the last thing pressed, so the adapter is toggling sections it has already opened. R-2.11: '5. References' is fully filled, and the 'Review Terms and Conditions' dialog is open with both acknowledgements ticked and 'Submit Proposal' offered inside it. The adapter spun in press()'s retry loop (index.ts:578) until the timeout without pressing it. R-2.37: the proposal was stored as Submitted, and the vendor's proposal page shows 'Export Proposal' with an empty, closing dialog still in the tree. The adapter never navigated to the printable copy. Tier is STANDARD and no residual risk is marked unaccepted, so nothing escalates. What would change this ruling: a rebind fixing these faults after which a criterion still fails at the same assertion makes it a product-question. For R-8.5, a captured request showing the 503 answered a malformed, harness-built upload would make it adapter-wrong.

**Conditions:**
- product-question R-8.5
- adapter-wrong R-2.7: on proposal-swu-create's '2. Team' step for a one-phase opportunity, whose 'Implementation' section is open by default and already shows 'Phase Dates' and 'Add Team Member(s)', openTeamPhases presses the phase name when teamPhaseAdder misses the adder, which folds the section, and add_phase_team_member then throws 'no Add Team Member(s) inside Implementation'. Press a phase name only when its section shows no 'Phase Dates' below it. In the draft test, once the member was on the phase with the Scrum Master radio ticked, set_phase_proposed_cost never reached '3. Pricing': the step list shows only the current step, so move forward with the form's 'Next' until 'Implementation Cost*' shows.
- adapter-wrong R-2.11: on proposal-swu-create, with all three references filled on '5. References', the 'Review Terms and Conditions' dialog was open with both acknowledgement checkboxes ticked and 'Submit Proposal' offered inside it as pressable text, and press() looped (index.ts:578) until the test timed out without pressing it. Find and press 'Submit Proposal' inside the open dialog by its text, not by button role, before looking on the page behind it.
- adapter-wrong R-2.19: proposal-swu-create's openTeamPhases re-presses a phase name whose section is already unfolded. The snapshot shows 'Proof of Concept' open with its 'Add Team Member(s)' visible and the name itself as the last element pressed, while 'Implementation' stays folded, and the test times out. Decide whether a section is open from whether 'Phase Dates' or its 'Add Team Member(s)' shows below its name, press only a folded name, once, and wait for its section to open before moving to the next phase.
- adapter-wrong R-2.37: after 'Submit Proposal' the service stored the proposal as Submitted and showed the vendor's proposal page with an 'Export Proposal' link, but an empty, closing dialog (heading with no text) was still in the tree and the adapter never navigated to /opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export. Treat a dialog with no text as gone, or wait for it to detach, and let proposal-swu-export-one.open go to the export address.
