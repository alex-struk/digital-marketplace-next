---
gate: G3
question: "Do the revised proposals tests now follow from their criteria and from nothing else?"
recommendation: "All four actionable conditions are applied."
opened: 2026-09-07T14:38:25.087Z
---

# Do the revised proposals tests now follow from their criteria and from nothing else?

**Recommendation.** All four actionable conditions are applied.

All four actionable conditions are applied. Here is my journal.

---

**Journal — proposals acceptance suite, revision pass**

I acted only on the five conditions attached to the return. I re-derived nothing: every criterion outside those conditions kept the file it already had, byte for byte, and no header's `derived` date was touched (all edited files already carried today's date, so none would have changed in any case).

**Condition 1 — the contradictory pairs.** The reviewer is right that `spec/domains/proposals.md` already resolves what my earlier journal referred to the gate. R-2.6 carries `superseded-by: R-2.9` and R-2.8 carries `superseded-by: R-2.10`, with matching `replaces` on each replacement, and `spec/criteria-index.json` records the same `supersededBy`/`replaces` pairs. I missed that on the first pass and treated the pairs as an open conflict; they are not. I deleted `tests/acceptance/proposals/R-2.6.spec.ts` and `R-2.8.spec.ts`. Because both superseded criteria are still `state: accepted` in the index — the coverage report counts them — each needed to stand somewhere rather than simply vanish, so both got a `not-testable.yaml` entry naming the supersession, the contradiction it resolves, and the replacement file that now carries the behaviour. `R-2.9.spec.ts` (vendor may read their own proposal's history in all three programs) and `R-2.10.spec.ts` (an over-budget Team With Us proposal is refused on both create and edit) were already present and untouched; the two behaviours are now asserted once each, in the direction the accepted replacements state.

**Condition 2 — R-2.4.** Dropped the `availableActions()` assertion at what was line 71. R-2.4 says the delete request is refused and a deleted draft can no longer be opened; whether the action is also hidden from the page's action list is a separate claim the criterion never makes. The refusal itself (`deleteProposal()` rejects) and the draft's disappearance are still asserted.

**Condition 3 — R-2.33.** Dropped the `opportunityCwuView.successfulProponent()` assertion at what was line 94. The observation exists in the contract, so this was over-assertion rather than a surface gap: R-2.33 states the awarded proposal becomes awarded, the opportunity becomes awarded, and the disqualified and withdrawn proposals keep their state. All three are still asserted; naming the winner on the opportunity page is not.

**Condition 4 — R-2.36.** Dropped the `Subject` assertion at what was line 69, and collapsed the now-redundant local into the single assertion the criterion supports: a confirmation reaches the submitting vendor. What that mail says is not stated by R-2.36. The award, decision and withdrawal notices in the same file were already asserted only as existence and were left alone.

**Condition 5 — contract findings, carried, not blocking.** These are gaps in `tests/generated/surface.d.ts`, each re-checked against the contract before reporting, and each is for the contract owner rather than this stage:

- **No `close_opportunity` action and no scheduled-transitions trigger** anywhere in the surface. The edit pages offer only `cancelOpportunity` and `deleteOpportunity`; the sole trace of closure is the `closedGroup()` observation on the opportunity list. Tests that need a closed opportunity (R-2.33, R-2.36, and others) reach it by editing the proposal deadline into the past and then issuing a further request, which is indirect and depends on when the transitions run.
- **No `fieldError()` on `proposal-cwu-edit`, `proposal-swu-edit` or `proposal-twu-edit`.** All three create pages have it; none of the edit pages does, so a validation refusal on an edit can only be observed as a thrown action.
- **No `budgetExceededError()` on `proposal-twu-create`.** `proposal-swu-create` has exactly this observation. Its absence on the Team With Us side is felt directly by R-2.10, whose whole subject is that refusal.
- **No `historyTab()` on the vendor-facing edit pages.** The staff-facing view pages carry it for all three programs; the pages a vendor actually reaches for their own proposal do not — which is precisely what R-2.9 is about.
- **No `anonymousProponentName()` on `proposal-twu-export-one`.** `proposal-swu-export-one` has it; the Team With Us export page exposes only `exportedProposal()`.
- **No way to open a proposal from `proposal-vendor-dashboard`.** The page offers `showMyProposals`/`showOrgProposals` and two table observations, but no action that opens a listed proposal, so tests reach a proposal by opening its edit page against an opportunity title instead.

**Coverage after this pass:** 35 spec files under `tests/acceptance/proposals/`, and three `not-testable.yaml` entries for the proposals domain — R-2.6 and R-2.8 as superseded, R-2.7 for the real surface absence the reviewer confirmed (no creation action, and no input to one, names a proposal's state, so the third-state refusal cannot be provoked). No condition went unactioned.
