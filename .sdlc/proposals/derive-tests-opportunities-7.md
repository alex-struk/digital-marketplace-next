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
