// criterion: @R-5.36 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// One test per program, each walking the same route with the same actions in the same
// order: close, every evaluator scores every proponent and submits, the chair agrees a
// score per proponent and submits the set, and the scores are finalised. That the two walks
// are written from the same steps is what "the same evaluation from end to end" amounts to
// here; the only differences are which pages the walk goes through, and each program has
// its own.
//
// Two of the three differences the criterion allows are read back. What the questions are
// called is read from the tab each program's management screen offers — team questions on
// one, resource questions on the other — and what the next stage is called is read from the
// status the opportunity reaches, which must name the Code Challenge for one and the
// Challenge without it for the other.
//
// The third difference — four proponents carried forward against three — is not asserted.
// Each seeded opportunity carries three proponents, so neither ceiling can be reached.

const questions = [0, 1, 2, 3];

const swu = {
  opportunityId: seed.opportunities.closedSprintWithUs.id,
  proposals: [
    seed.proposals.sprintWithUsOne.id,
    seed.proposals.sprintWithUsTwo.id,
    seed.proposals.sprintWithUsThree.id,
  ],
};

const twu = {
  opportunityId: seed.opportunities.closedTeamWithUs.id,
  proposals: [
    seed.proposals.teamWithUsOne.id,
    seed.proposals.teamWithUsTwo.id,
    seed.proposals.teamWithUsThree.id,
  ],
};

async function evaluateSwu(surface: Surface): Promise<void> {
  for (const proposalId of swu.proposals) {
    await surface.evaluationIndividualCreateSwu.open({
      opportunityId: swu.opportunityId,
      proposalId,
    });
    for (const order of questions) {
      await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateSwu.saveDraft();
  }
  await surface.evaluationIndividualListSwu.open({ opportunityId: swu.opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
}

async function evaluateTwu(surface: Surface): Promise<void> {
  for (const proposalId of twu.proposals) {
    await surface.evaluationIndividualCreateTwu.open({
      opportunityId: twu.opportunityId,
      proposalId,
    });
    for (const order of questions) {
      await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateTwu.saveDraft();
  }
  await surface.evaluationIndividualListTwu.open({ opportunityId: twu.opportunityId });
  await surface.evaluationIndividualListTwu.submitScoresForConsensus();
}

test("a Sprint With Us opportunity runs from individual evaluation through consensus to the Code Challenge", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await evaluateSwu(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await evaluateSwu(surface);

  await surface.opportunitySwuEdit.open({ opportunityId: swu.opportunityId });
  expect(await surface.opportunitySwuEdit.teamQuestionsTab()).toBeTruthy();

  for (const proposalId of swu.proposals) {
    await surface.evaluationConsensusCreateSwu.open({
      opportunityId: swu.opportunityId,
      proposalId,
    });
    for (const order of questions) {
      await surface.evaluationConsensusCreateSwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationConsensusCreateSwu.enterQuestionNotes({
        order,
        notes: "The panel agreed on this score for this answer.",
      });
    }
    await surface.evaluationConsensusCreateSwu.saveDraft();
  }

  await surface.evaluationConsensusListSwu.open({ opportunityId: swu.opportunityId });
  await surface.evaluationConsensusListSwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListSwu.confirmSubmitConsensus();
  await surface.evaluationConsensusListSwu.finalizeConsensusScores();
  await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();

  await surface.opportunitySwuView.open({ opportunityId: swu.opportunityId });
  expect((await surface.opportunitySwuView.status()).toLowerCase()).toContain("code challenge");
});

test("a Team With Us opportunity runs the same course and ends at the Challenge", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await evaluateTwu(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await evaluateTwu(surface);

  await surface.opportunityTwuEdit.open({ opportunityId: twu.opportunityId });
  expect(await surface.opportunityTwuEdit.resourceQuestionsTab()).toBeTruthy();

  for (const proposalId of twu.proposals) {
    await surface.evaluationConsensusCreateTwu.open({
      opportunityId: twu.opportunityId,
      proposalId,
    });
    for (const order of questions) {
      await surface.evaluationConsensusCreateTwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationConsensusCreateTwu.enterQuestionNotes({
        order,
        notes: "The panel agreed on this score for this answer.",
      });
    }
    await surface.evaluationConsensusCreateTwu.saveDraft();
  }

  await surface.evaluationConsensusListTwu.open({ opportunityId: twu.opportunityId });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();
  await surface.evaluationConsensusListTwu.finalizeConsensusScores();
  await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();

  await surface.opportunityTwuView.open({ opportunityId: twu.opportunityId });
  const status = (await surface.opportunityTwuView.status()).toLowerCase();
  expect(status).toContain("challenge");
  expect(status).not.toContain("code challenge");
});
