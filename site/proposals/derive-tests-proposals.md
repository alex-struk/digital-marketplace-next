| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-07T12:18:00.589Z |
| holder | agent:reviewer |

# Do these tests follow from the proposals criteria and from nothing else?

**Recommendation.** **What I did.** I derived acceptance tests for the 38 accepted criteria of the proposals domain, working only from `spec/`, `tests/seed/` and the generated contract (`tests/generated/surface.d.ts`, `p…

Done. All files are written and the forbidden-pattern check is clean.

## Journal

**What I did.** I derived acceptance tests for the 38 accepted criteria of the proposals domain, working only from `spec/`, `tests/seed/` and the generated contract (`tests/generated/surface.d.ts`, `personas.ts`, `seed.ts`). 37 criteria got a spec file under `tests/acceptance/proposals/`, roughly 90 tests in total, one `test()` per outcome the criterion states. One criterion, **R-2.7**, went into `not-testable.yaml` instead: it turns on a proposal being *created in a state that is neither draft nor submitted* and refused for it, and the proposal pages carry exactly two creation actions — `save_draft` and `submit_proposal` — with no action and no input naming a state, so the refusal cannot be provoked through the surface at all. Its two accepted states are exercised incidentally by R-2.12 and R-2.13.

**Conventions I had to invent, because the contract does not settle them.** Two gaps forced choices that whoever writes the contract next should either bless or replace.

*Addressing.* Nothing in the surface hands a test back an identifier for a record it just made, and `open(params)` takes only strings. Since the seed deliberately contains no proposals and only one Code With Us opportunity, almost every test has to build its own opportunity and then find it again. I settled on naming: a test gives each thing it creates a distinctive title or legal name and addresses it by that (`open({ opportunityTitle: "…" })`), refers to seeded records by `seed.<group>.<handle>.id`, and addresses a proposal as `{ opportunityTitle }` — unambiguous because a vendor holds at most one proposal per opportunity (R-2.2) — with a `proponent`, `organizationId` or `authorId` qualifier when another party's proposal is meant. The contract needs either a stated addressing scheme or an observation on each page naming the record it is showing.

*Closing an opportunity.* Sixteen criteria have "the opportunity has closed" or "the deadline has passed" in their given, and no page offers a way to bring that about; `observables.yaml` describes the transitions as a hook that runs in front of any request, but that trigger is not represented on any page. I wrote those tests to move the proposal deadline into the past through `opportunity-*-edit.edit_details` and then make one more request before reading. If the application refuses a past deadline on edit, every one of those tests fails at setup and R-2.5, R-2.15, R-2.23, R-2.25–R-2.38 become not-testable as written. **A `close_opportunity` action, or a surface for the scheduled-transitions trigger, is the single most valuable thing the contract could gain.**

**Surface actions and observations I needed and did not find.**

- A refusal observation on the proposal pages. `file-download` has `refused_when_not_permitted`; the proposal pages have nothing equivalent, so permission refusals (R-2.1, R-2.24, R-2.38) are asserted as the action rejecting.
- `field_error` on `proposal-cwu-edit`, `proposal-swu-edit`, `proposal-twu-edit`. The create pages have it; the edit pages do not, so refusals on the edit and re-submit paths (R-2.10, R-2.11, R-2.15, R-2.22) are asserted through the rejected action, which loses the message the criterion names.
- `budget_exceeded_error` on `proposal-twu-create`. Sprint With Us has one; R-2.10's whole point is that Team With Us should apply the same ceiling, so it needs the same observation.
- A `history_tab` on the vendor-facing `proposal-*-edit` pages. History is observable only on the staff-facing `*-view` pages, so R-2.6 and R-2.9 read a vendor's own history through a page whose reachability by a vendor is itself what is in question.
- `anonymous_proponent_name` on `proposal-twu-export-one`. Sprint With Us's export has it; without the Team With Us one, R-2.37 could only be written for Sprint With Us.
- A way to name a stored file that does not exist, for R-2.12's "attachments are checked even in draft". I expressed it as `add_attachment({ fileName, uploaded: false })`, which is a placeholder, not something the contract supports.
- An action on `proposal-vendor-dashboard` to open a proposal from the list. The dashboard is the only place a vendor's proposals are listed and there is no way to follow one.

**Seed limits worth recording.** Only one organization is a qualified supplier, and an organization may bid only once per opportunity, so every scenario with several proponents (R-2.5, R-2.29, R-2.30, R-2.31, R-2.38) registers and qualifies fresh organizations through the pages first — long setups that will be slow and are the most likely thing to break. R-2.29 could not be tested at its stated scale: carrying "the top four" into the code challenge needs five or more qualified suppliers, so I tested the rule with two proposals, one below the question's minimum. The seed also carries no display names for people, and no observation exposes a history entry's author separately, so R-2.35 asserts the states and the score but not the "who".

**One thing for whoever rules on this proposal.** R-2.6 and R-2.9 are both marked accepted and contradict each other: R-2.6 says a vendor cannot see the history of their own Code With Us proposal, R-2.9 (which replaces it) says they can, in all three programs. I wrote both faithfully, so one of the two files will fail against any target. That is a decision the gate should make, not something a test can resolve.

## Ruling

**Verdict:** return
**By:** agent:reviewer

Two derivation faults. First, R-2.6.spec.ts and R-2.8.spec.ts assert outcomes that R-2.9.spec.ts and R-2.10.spec.ts directly contradict (vendor visibility of Code With Us proposal history; acceptance of an over-budget Team With Us proposal), so two of the four can never pass; the journal refers this to the gate, but spec/domains/proposals.md already resolves it — R-2.6 carries superseded-by: R-2.9 and R-2.8 carries superseded-by: R-2.10, with matching `replaces` on the replacements. Second, three assertions state more than their criterion does: R-2.4.spec.ts:71 asserts availableActions() omits "Delete" where R-2.4 says only that the delete request is refused; R-2.33.spec.ts:94 asserts opportunityCwuView.successfulProponent() names the winner, which R-2.33 never states; R-2.36.spec.ts:69 asserts the confirmation Subject contains "Proposal", where R-2.36 states only that a confirmation is sent. The rest of the suite is sound: no selectors, routes, status codes or table names anywhere under tests/acceptance/proposals/; every quoted refusal message (R-2.11, R-2.15, R-2.16, R-2.17, R-2.18, R-2.21, R-2.22, R-2.26, R-2.27, R-2.28) is quoted verbatim in its own criterion rather than lifted from an implementation; and the single not-testable entry, R-2.7, names a real absence — that criterion turns on creating a proposal in a third state, and the create pages in tests/generated/surface.d.ts carry only saveDraft and submitProposal with no state input.

**Conditions:**
- Derive from R-2.9 and R-2.10 only; remove tests/acceptance/proposals/R-2.6.spec.ts and R-2.8.spec.ts, recording each as superseded (a not-testable.yaml entry citing the supersession if the coverage report requires an entry per accepted criterion).
- Drop the assertion at R-2.4.spec.ts:71 that availableActions() does not contain "Delete"; R-2.4 asserts only that the delete request is refused and that a deleted draft can no longer be opened.
- Drop the assertion at R-2.33.spec.ts:94 on opportunityCwuView.successfulProponent(); R-2.33 states the proposal becomes awarded, the opportunity becomes awarded, and the disqualified and withdrawn proposals keep their state.
- Drop the assertion at R-2.36.spec.ts:69 on the confirmation's Subject; R-2.36 states that a confirmation reaches the submitting vendor, not what it says.
- Carry the surface gaps the journal names (no close_opportunity action or scheduled-transitions trigger, no field_error on proposal-*-edit, no budget_exceeded_error on proposal-twu-create, no history_tab on the vendor-facing edit pages, no anonymous_proponent_name on proposal-twu-export-one, no way to open a proposal from proposal-vendor-dashboard) to the contract owner as contract findings; they do not block this stage.
