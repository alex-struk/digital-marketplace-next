// criterion: @R-5.22 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// Every question of both seeded closed opportunities is worth five points, which is what
// tests/seed records, so six is above the maximum for any of them and the criterion's own
// example can be used as written. The evaluator is users.staffOne, who sits on both seeded
// panels as an evaluator and is reached through persona.publicSectorStaff.
//
// The score with three decimal places is not tested here. The individual create pages
// report a rejected score only as score_out_of_range_error, and a too-precise score inside
// the range is not out of range, so no observation says such an entry was refused. That half
// needs a decimal-places observation on evaluation-individual-create-swu and -twu.
//
// The last clause of the then — that the evaluation cannot be submitted until every question
// carries a score and a comment — is not tested here. Submission is offered or withheld for
// the whole set on the individual list, and it is withheld just the same when nothing at all
// has been entered, so reading it after a rejected entry would say nothing about the entry.
// R-5.25 reads that withholding on its own terms.
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
