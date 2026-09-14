// criterion: @R-5.22 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona, seed } from "../../fixtures";

// Every question of the seeded Sprint With Us opportunity is worth five points, which is
// what tests/seed records, so six is above the maximum for any of the four and the
// criterion's own example can be used as it is written.
//
// The score with three decimal places is not tested here. The individual create page
// reports a rejected score only as score_out_of_range_error, and a too-precise score inside
// the range is not out of range, so no observation on that page says such an entry was
// refused. That half needs a decimal-places observation on evaluation-individual-create-swu
// and -twu, such as score_too_many_decimal_places_error.
//
// The last clause of the then — that the evaluation cannot be submitted until every question
// carries a score and a comment — is not tested here. Showing it would mean saving the
// empty-comment entry as a draft and submitting it, and the form refuses to save that draft,
// which is what the R-5.23 entry in not-testable.yaml records: it needs an action on
// evaluation-individual-create that saves a draft the form would refuse. A disabled submit
// control on the individual list is not read in its place: the criterion says nothing about
// a disabled control, and R-5.25 submits an incomplete set from that same list.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposalId = seed.proposals.sprintWithUsOne.id;

test("a score above the question's maximum is rejected", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 0, score: 6 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
    order: 0,
    notes: "A full answer to the first question.",
  });

  expect(await surface.evaluationIndividualCreateSwu.scoreOutOfRangeError()).toBeTruthy();
});

test("an empty comment is rejected", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 0, score: 4 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ order: 0, notes: "" });

  expect(await surface.evaluationIndividualCreateSwu.emptyNotesError()).toBeTruthy();
});
