---
gate: G3
question: "Do the revised opportunities tests now follow from their criteria and from nothing else?"
recommendation: "I acted on the reviewer's one condition, and only in `tests/acceptance/opportunities/R-1.35.spec.ts`."
opened: 2026-09-25T10:30:38.665Z
---

# Do the revised opportunities tests now follow from their criteria and from nothing else?

**Recommendation.** I acted on the reviewer's one condition, and only in `tests/acceptance/opportunities/R-1.35.spec.ts`.

I acted on the reviewer's one condition, and only in `tests/acceptance/opportunities/R-1.35.spec.ts`. No other spec file and no entry in `tests/acceptance/not-testable.yaml` was touched.

**The condition on R-1.35.** I took the reviewer's second suggestion: I accept that `persona.vendor` may already have a proposal on `seed.opportunities.publishedCodeWithUs`, and check that a submitted one is there rather than that the proposal count went up. The vendor still tries to submit. That attempt is now wrapped so that a refusal (because the vendor already holds one) doesn't stop the test. The given is then read back on the vendor's own dashboard: `surface.proposalVendorDashboard.open()`, then `showMyProposals()`, then `myProposalsTable()`. The test polls until the row naming the seeded opportunity's title says it was submitted. That holds whether R-1.31 or R-1.35 runs first. A draft or withdrawn proposal would not pass, so the test still requires the proponent to have actually submitted.

The watcher side is unchanged. `persona.competingVendor` toggles watch once, and the administrator still polls that the reported watcher count rose. No other spec toggles watch as that persona on this record, so that reading doesn't depend on run order. I removed the helper that read the proposal count and the assertion on it, since nothing uses them now. The rest of the test is untouched: the check that the opportunity is published, clearing the mail catcher, changing the details, adding the addendum, and checking that the watcher, the proponent and the author are each reached. The header comment explains the new arrangement. The header's `derived 2026-09-25` stays as it was because it is already today, and the file's content did change.

I rejected the reviewer's other suggestion, a persona that no other spec uses to submit against this record. Specs in the files domain already submit against seeded Code With Us opportunities as `organizationAdmin`, and any persona I picked could be taken by a later derivation. Reading the vendor's own proposal is order-independent by construction.

**What I could not do.** I could not run the typecheck: running `tsc` here needs an approval that wasn't available. Every call I added (`proposalVendorDashboard.open`, `showMyProposals`, `myProposalsTable`) is declared in `tests/generated/surface.d.ts` with the signature I used, but whoever runs this next should confirm there are still no diagnostics under `acceptance/opportunities/`.

One point for whoever writes the contract next: the test assumes `my_proposals_table` puts each proposal on its own line, with the opportunity's title and its status in that row. The contract doesn't describe the table's shape. An observation for one proposal's status on a given opportunity (`proposalStatus()` exists but isn't tied to a row) would make this check less dependent on layout. No surface action or observation was missing for this condition, and nothing asked me to change files outside my stage's paths.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

Do the revised opportunities tests now follow from their criteria and nothing else? Yes: approved. Only tests/acceptance/opportunities/R-1.35.spec.ts changed since derive-tests-opportunities-6, and it acts on that ruling's one condition. The proponent is no longer shown by a proposal count going up, which failed on a correct application whenever R-1.31 ran first. The vendor's submission is attempted, and a refusal is tolerated. The test then waits until the vendor's own dashboard lists a submitted proposal against the seeded opportunity. That holds in either order, and a draft or withdrawn proposal still would not pass. The watcher side is order-independent: persona.competingVendor maps to seed.users.proponentTwo, the watcher whose mail is checked, and no other spec toggles watch as that persona on this record. No proposals-domain spec touches this record, so nothing withdraws the vendor's proposal. The runner's typecheck reports no diagnostics under acceptance/opportunities/; its one diagnostic is under adapters/new/, which this proposal does not answer for. The test checks that each of watcher, proponent and author is reached but not that each is reached exactly once. That asserts less than the criterion states, not more, so it is not grounds to return. This ruling would change if a diagnostic appeared under acceptance/opportunities/, or if a verify run showed that my_proposals_table does not put each proposal's title and status on one line. The test relies on that layout and the contract does not describe it. The missing-test entries listed stay open until their tests run; a ruling cannot close them.

**Conditions:**
- condition-met derive-tests-opportunities-6#2: tests/acceptance/opportunities/R-1.35.spec.ts no longer reads a proposal count; arrangeWatcherAndProponent wraps persona.vendor's submission in a try/catch and then polls ownProposalRow (proposalVendorDashboard.open, showMyProposals, myProposalsTable) until the row naming seed.opportunities.publishedCodeWithUs.title matches /submit/, which holds whether R-1.31 or R-1.35 runs first

### Runner-owned typecheck evidence

Proposal revision: `f2ee72088625a1e683f7b78b67dc74dd9d469a40`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 1 diagnostic
