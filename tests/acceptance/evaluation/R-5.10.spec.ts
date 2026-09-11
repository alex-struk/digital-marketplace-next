// criterion: @R-5.10 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Two tests, one for each program, because the criterion names a different stage for each.
// They use different seeded opportunities and do not stand in each other's way.
//
// The fourth question of each seeded opportunity carries a minimum score of three, so an
// agreed score of one on that question puts every proponent below a minimum while leaving
// every other rule satisfied: a consensus exists for all three proponents, all of them are
// submitted, and every score is inside the question's range. That leaves the refusal the
// criterion is about as the only one finalising can produce.
//
// The Team With Us assertion is written as two parts because the wrong answer contains the
// right one: a message naming the Code Challenge would satisfy a test that only looked for
// "challenge", and naming the Code Challenge on a Team With Us opportunity is exactly the
// fault this criterion replaces.

const questions = [0, 1, 2, 3];

// Five out of five on the first three questions and one on the fourth, which carries a
// minimum of three.
function scoreFor(order: number): number {
  return order === 3 ? 1 : 5;
}

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

async function scoreEveryProponentSwu(surface: Surface): Promise<void> {
  for (const proposalId of swu.proposals) {
    await surface.evaluationIndividualCreateSwu.open({
      opportunityId: swu.opportunityId,
      proposalId,
    });
    for (const order of questions) {
      await surface.evaluationIndividualCreateSwu.enterQuestionScore({
        order,
        score: scoreFor(order),
      });
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

async function scoreEveryProponentTwu(surface: Surface): Promise<void> {
  for (const proposalId of twu.proposals) {
    await surface.evaluationIndividualCreateTwu.open({
      opportunityId: twu.opportunityId,
      proposalId,
    });
    for (const order of questions) {
      await surface.evaluationIndividualCreateTwu.enterQuestionScore({
        order,
        score: scoreFor(order),
      });
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

test("the refusal on a Sprint With Us opportunity names the Code Challenge", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponentSwu(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponentSwu(surface);

  for (const proposalId of swu.proposals) {
    await surface.evaluationConsensusCreateSwu.open({
      opportunityId: swu.opportunityId,
      proposalId,
    });
    for (const order of questions) {
      await surface.evaluationConsensusCreateSwu.enterQuestionScore({
        order,
        score: scoreFor(order),
      });
      await surface.evaluationConsensusCreateSwu.enterQuestionNotes({
        order,
        notes: "The panel agreed this answer fell short on the last question.",
      });
    }
    await surface.evaluationConsensusCreateSwu.saveDraft();
  }

  await surface.evaluationConsensusListSwu.open({ opportunityId: swu.opportunityId });
  await surface.evaluationConsensusListSwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListSwu.confirmSubmitConsensus();
  await surface.evaluationConsensusListSwu.finalizeConsensusScores();
  await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();

  const refusal = await surface.evaluationConsensusListSwu.noScreenableProponentError();
  expect(refusal.toLowerCase()).toContain("code challenge");
});

test("the refusal on a Team With Us opportunity names the Challenge", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponentTwu(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponentTwu(surface);

  for (const proposalId of twu.proposals) {
    await surface.evaluationConsensusCreateTwu.open({
      opportunityId: twu.opportunityId,
      proposalId,
    });
    for (const order of questions) {
      await surface.evaluationConsensusCreateTwu.enterQuestionScore({
        order,
        score: scoreFor(order),
      });
      await surface.evaluationConsensusCreateTwu.enterQuestionNotes({
        order,
        notes: "The panel agreed this answer fell short on the last question.",
      });
    }
    await surface.evaluationConsensusCreateTwu.saveDraft();
  }

  await surface.evaluationConsensusListTwu.open({ opportunityId: twu.opportunityId });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();
  await surface.evaluationConsensusListTwu.finalizeConsensusScores();
  await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();

  const refusal = await surface.evaluationConsensusListTwu.noScreenableProponentError();
  expect(refusal.toLowerCase()).toContain("challenge");
  expect(refusal.toLowerCase()).not.toContain("code challenge");
});
