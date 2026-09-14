// criterion: @R-5.32 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seeded Sprint With Us opportunity carries three proponents, not the six the criterion
// describes, so the ceiling — at most four carried into the code challenge — cannot be
// reached and is not asserted. What can be set up is the part the ceiling sits on: two
// proponents that met every minimum and one that did not. The fourth question carries a
// minimum of three, so the proponent given one on it falls short while the other two do
// not.
//
// The screening is read from the proponents themselves rather than from the opportunity,
// because a proponent screened into the code challenge is one whose own proposal has moved
// to that stage. Each of the two is read by the vendor who submitted it, which is the only
// person the target can sign in as who is offered a proposal's own status.
//
// The agreed scores being recorded is read as the questions score standing against each
// proposal afterwards, including the proposal that was passed over: the criterion has the
// scores recorded against every proponent and the screening applied only to those that
// cleared their minimums.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const screenedIn = seed.proposals.sprintWithUsOne.id;
const fallsShort = seed.proposals.sprintWithUsTwo.id;
const proposals = [screenedIn, fallsShort, seed.proposals.sprintWithUsThree.id];
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

test("finalising records the agreed scores, screens in the proponents that met every minimum, and moves the opportunity on", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface);

  for (const proposalId of proposals) {
    await surface.evaluationConsensusCreateSwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      const shortOnTheLastQuestion = proposalId === fallsShort && order === 3;
      await surface.evaluationConsensusCreateSwu.enterQuestionScore({
        order,
        score: shortOnTheLastQuestion ? 1 : 5,
      });
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

  await surface.opportunitySwuView.open({ opportunityId });
  expect((await surface.opportunitySwuView.status()).toLowerCase()).toContain("challenge");

  await surface.proposalSwuView.open({ opportunityId, proposalId: screenedIn });
  expect(await surface.proposalSwuView.questionsScore()).toBeTruthy();
  await surface.proposalSwuView.open({ opportunityId, proposalId: fallsShort });
  expect(await surface.proposalSwuView.questionsScore()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuEdit.open({ opportunityId, proposalId: screenedIn });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("challenge");
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await surface.proposalSwuEdit.open({ opportunityId, proposalId: fallsShort });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).not.toContain("challenge");
});
