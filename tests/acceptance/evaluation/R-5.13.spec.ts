// criterion: @R-5.13 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seeded Sprint With Us opportunity carries three proponents, all of them under review
// of the questions once it closes. The chair agrees scores for two of them and leaves the
// third alone, which is the state the criterion is about: a proponent with no submitted
// consensus who would otherwise be left neither screened in nor screened out.
//
// The two agreed sets are five out of five on every question, so both clear the minimum the
// fourth question carries. That matters: it leaves not_all_consensuses_submitted_error as
// the only refusal finalising could produce, so a test that passes is reading the rule this
// criterion is about rather than the one R-5.10 is about.
//
// One test, because the criterion states one given, one when and one then, and because the
// walk that puts the opportunity into consensus can only be made once.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposals = [
  seed.proposals.sprintWithUsOne.id,
  seed.proposals.sprintWithUsTwo.id,
  seed.proposals.sprintWithUsThree.id,
];
const questions = [0, 1, 2, 3];

async function scoreEveryProponent(surface: Surface): Promise<void> {
  for (const proposalId of proposals) {
    await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateSwu.saveDraft();
  }
  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
}

test("finalising is refused unless every proponent still under review has a submitted consensus", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface);

  for (const proposalId of [seed.proposals.sprintWithUsOne.id, seed.proposals.sprintWithUsTwo.id]) {
    await surface.evaluationConsensusCreateSwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationConsensusCreateSwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationConsensusCreateSwu.enterQuestionNotes({
        order,
        notes: "The panel agreed on this score for this answer.",
      });
    }
    await surface.evaluationConsensusCreateSwu.saveDraft();
  }

  await surface.evaluationConsensusListSwu.open({ opportunityId });
  await surface.evaluationConsensusListSwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListSwu.confirmSubmitConsensus();

  await surface.evaluationConsensusListSwu.finalizeConsensusScores();
  await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();

  expect(await surface.evaluationConsensusListSwu.notAllConsensusesSubmittedError()).toBeTruthy();

  await surface.opportunitySwuView.open({ opportunityId });
  expect((await surface.opportunitySwuView.status()).toLowerCase()).toContain("consensus");
});
