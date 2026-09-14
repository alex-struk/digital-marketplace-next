// criterion: @R-5.29 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion states one given, one when and one then, with two attempts inside the when,
// so it is one test. It has to be: the walk that puts the seeded Team With Us opportunity
// into consensus consumes it — every evaluator's scores can be submitted once — so a second
// test in this file would start from a state the first one left behind rather than from the
// given.
//
// Team With Us is used here and Sprint With Us in the criteria about finalising, so that the
// two seeded opportunities are not both spent on the same part of the walk.
//
// chair_only is read twice, once for the evaluator who is not the chair and once for the
// chair, so that a page reporting the same thing to everybody would fail rather than pass.
//
// The last clause — that a consensus may be recorded only while the opportunity is in
// consensus — is not asserted. Before consensus the create form has no observation that
// tells a refusal from an empty form, and after finalising there is nothing left to record.

const opportunityId = seed.opportunities.closedTeamWithUs.id;
const proposals = [
  seed.proposals.teamWithUsOne.id,
  seed.proposals.teamWithUsTwo.id,
  seed.proposals.teamWithUsThree.id,
];
const questions = [0, 1, 2, 3];

async function scoreEveryProponent(surface: Surface): Promise<void> {
  for (const proposalId of proposals) {
    await surface.evaluationIndividualCreateTwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order, score: 4 });
      await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateTwu.saveDraft();
  }
  await surface.evaluationIndividualListTwu.open({ opportunityId });
  await surface.evaluationIndividualListTwu.submitScoresForConsensus();
}

async function agreeConsensus(surface: Surface, proposalId: string): Promise<void> {
  await surface.evaluationConsensusCreateTwu.open({ opportunityId, proposalId });
  for (const order of questions) {
    await surface.evaluationConsensusCreateTwu.enterQuestionScore({ order, score: 4 });
    await surface.evaluationConsensusCreateTwu.enterQuestionNotes({
      order,
      notes: "The panel agreed on this score for this answer.",
    });
  }
  await surface.evaluationConsensusCreateTwu.saveDraft();
}

test("only the chair may record the consensus, and only one consensus per proponent", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationConsensusCreateTwu.open({
    opportunityId,
    proposalId: seed.proposals.teamWithUsOne.id,
  });
  expect(await surface.evaluationConsensusCreateTwu.chairOnly()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.evaluationConsensusCreateTwu.open({
    opportunityId,
    proposalId: seed.proposals.teamWithUsOne.id,
  });
  expect(await surface.evaluationConsensusCreateTwu.chairOnly()).toBeFalsy();

  await agreeConsensus(surface, seed.proposals.teamWithUsOne.id);
  await agreeConsensus(surface, seed.proposals.teamWithUsOne.id);

  expect(await surface.evaluationConsensusCreateTwu.duplicateConsensusError()).toBeTruthy();
});
