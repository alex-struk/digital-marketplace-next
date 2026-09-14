// criterion: @R-5.16 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Five states, five tests. The first three are opportunities the test builds and leaves in
// draft, under review and published; the last two are the seeded Sprint With Us
// opportunity, which is in individual question evaluation as soon as its lapsed deadline is
// noticed, and in consensus once both of its evaluators have submitted their scores.
//
// The fourth test puts its change back. Adding a person to the seeded panel adds an
// evaluator the target cannot sign in as, and consensus waits for every evaluator, so a
// panel left changed would put the consensus stage out of reach for the fifth test and for
// every other criterion that walks that far. The change is made, read as accepted, and then
// undone.
//
// A panel that was accepted is read as the save going through — the lock is not reported
// and the panel surface shows members afterwards — rather than as the membership itself,
// which panel_member_row does not return in a form a test can compare with the people it
// named.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const details = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
  mandatorySkills: ["Frontend Development"],
  totalMaxBudget: 500000,
  questionsWeight: 25,
  codeChallengeWeight: 25,
  teamScenarioWeight: 25,
  priceWeight: 25,
};

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

const seeded = seed.opportunities.closedSprintWithUs.id;
const seededProposals = [
  seed.proposals.sprintWithUsOne.id,
  seed.proposals.sprintWithUsTwo.id,
  seed.proposals.sprintWithUsThree.id,
];
const questions = [0, 1, 2, 3];

async function prepareSprintWithUs(surface: Surface): Promise<void> {
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 500000,
    capabilities: ["Frontend Development"],
  });
  await surface.opportunitySwuCreate.addTeamQuestion({
    question: "Describe how your team has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel(panel);
}

async function scoreEveryProponent(surface: Surface): Promise<void> {
  for (const proposalId of seededProposals) {
    await surface.evaluationIndividualCreateSwu.open({ opportunityId: seeded, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateSwu.saveDraft();
  }
  await surface.evaluationIndividualListSwu.open({ opportunityId: seeded });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
}

test("the evaluation panel may be set while an opportunity is a draft", async ({ surface }) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title: "R-5.16 draft opportunity given a panel" });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.evaluationPanelSwu.open({ opportunityId });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.panelLockedAfterConsensus()).toBeFalsy();

  await surface.evaluationPanelSwu.open({ opportunityId });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeTruthy();
});

test("the evaluation panel may be changed while an opportunity is under review", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.submitForReview({
    ...details,
    title: "R-5.16 opportunity under review whose panel changed",
  });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.evaluationPanelSwu.open({ opportunityId });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.panelLockedAfterConsensus()).toBeFalsy();

  await surface.evaluationPanelSwu.open({ opportunityId });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeTruthy();
});

test("the evaluation panel may be changed while an opportunity is published", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.publish({
    ...details,
    title: "R-5.16 published opportunity whose panel changed",
  });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.evaluationPanelSwu.open({ opportunityId });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.panelLockedAfterConsensus()).toBeFalsy();

  await surface.evaluationPanelSwu.open({ opportunityId });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeTruthy();
});

test("the evaluation panel may be changed while an opportunity is in individual question evaluation", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelSwu.open({ opportunityId: seeded });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.panelLockedAfterConsensus()).toBeFalsy();

  await surface.evaluationPanelSwu.open({ opportunityId: seeded });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeTruthy();

  await surface.evaluationPanelSwu.removePanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();
});

test("the evaluation panel is fixed from the consensus stage onwards", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelSwu.open({ opportunityId: seeded });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.panelLockedAfterConsensus()).toBeTruthy();
});
