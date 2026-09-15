// criterion: @R-5.22 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// Every question of both seeded closed opportunities is worth five points, which is what
// tests/seed records, so six is above the maximum for any of the four and the criterion's
// own example can be used as it is written. The evaluator is users.staffOne, who sits on
// both seeded panels as an evaluator and is reached through persona.publicSectorStaff.
//
// The score with three decimal places is not tested here. The individual create pages
// report a rejected score only as score_out_of_range_error, and a too-precise score inside
// the range is not out of range, so no observation on either page says such an entry was
// refused. That half needs a decimal-places observation on evaluation-individual-create-swu
// and -twu, such as score_too_many_decimal_places_error.
//
// The last clause of the then — that the evaluation cannot be submitted until every question
// carries a score and a comment — is not tested here. Showing it would mean saving the
// rejected entry as a draft and submitting it, and the form refuses to save that draft,
// which is what the R-5.23 entry in not-testable.yaml records: it needs an action on
// evaluation-individual-create that saves a draft the form would refuse. A disabled submit
// control on the individual list is not read in its place: the criterion says nothing about
// a disabled control, and R-5.25 submits an incomplete set from that same list.
//
// The page marks a field a moment after it changes, so each rejection is read by retrying
// until it appears or the wait runs out. An empty comment is reached by writing a comment
// and then clearing it, so the comment really changes to empty before its mark is read.

const statement =
  "An evaluation carries one score and one comment per question, the score being between zero and that question's maximum with at most two decimal places, and the comment being at least one word.";

const sprintWithUs = {
  opportunityId: seed.opportunities.closedSprintWithUs.id,
  proposalId: seed.proposals.sprintWithUsOne.id,
};

const teamWithUs = {
  opportunityId: seed.opportunities.closedTeamWithUs.id,
  proposalId: seed.proposals.teamWithUsOne.id,
};

const settle = { timeout: 15000 };

test(`${statement} (Sprint With Us: six on a five-point question is rejected)`, async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open(sprintWithUs);
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 0, score: 6 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
    order: 0,
    notes: "A full answer to the first question.",
  });

  await expect
    .poll(() => surface.evaluationIndividualCreateSwu.scoreOutOfRangeError(), settle)
    .toBeTruthy();
});

test(`${statement} (Sprint With Us: an empty comment is rejected)`, async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateSwu.open(sprintWithUs);
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 0, score: 4 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
    order: 0,
    notes: "A full answer to the first question.",
  });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ order: 0, notes: "" });

  await expect
    .poll(() => surface.evaluationIndividualCreateSwu.emptyNotesError(), settle)
    .toBeTruthy();
});

test(`${statement} (Team With Us: six on a five-point question is rejected)`, async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateTwu.open(teamWithUs);
  await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order: 0, score: 6 });
  await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
    order: 0,
    notes: "A full answer to the first question.",
  });

  await expect
    .poll(() => surface.evaluationIndividualCreateTwu.scoreOutOfRangeError(), settle)
    .toBeTruthy();
});

test(`${statement} (Team With Us: an empty comment is rejected)`, async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationIndividualCreateTwu.open(teamWithUs);
  await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order: 0, score: 4 });
  await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
    order: 0,
    notes: "A full answer to the first question.",
  });
  await surface.evaluationIndividualCreateTwu.enterQuestionNotes({ order: 0, notes: "" });

  await expect
    .poll(() => surface.evaluationIndividualCreateTwu.emptyNotesError(), settle)
    .toBeTruthy();
});
