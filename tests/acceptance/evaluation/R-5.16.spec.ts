// criterion: @R-5.16 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Three of the five states the criterion names are reachable: a draft, an opportunity under
// review, and a published one. The other two are not. An opportunity reaches individual
// question evaluation, and then consensus, only by closing at its proposal deadline, and no
// page, action or observation makes that happen (see R-1.1), so neither the last permitted
// state nor the state the panel is fixed from can be established. The observation written
// for the refusal, panel_locked_after_consensus, is read here as the negative it should be
// in each of the three states that can be reached.
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

test("the evaluation panel may be set while an opportunity is a draft", async ({ surface }) => {
  const title = "R-5.16 draft opportunity given a panel";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });

  await surface.evaluationPanelSwu.open({ title });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.panelLockedAfterConsensus()).toBeFalsy();

  await surface.evaluationPanelSwu.open({ title });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeTruthy();
});

test("the evaluation panel may be changed while an opportunity is under review", async ({
  surface,
}) => {
  const title = "R-5.16 opportunity under review whose panel changed";

  await surface.signIn(persona.publicSectorStaff);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.submitForReview({ ...details, title });

  await surface.evaluationPanelSwu.open({ title });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.panelLockedAfterConsensus()).toBeFalsy();

  await surface.evaluationPanelSwu.open({ title });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeTruthy();
});

test("the evaluation panel may be changed while an opportunity is published", async ({
  surface,
}) => {
  const title = "R-5.16 published opportunity whose panel changed";

  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.publish({ ...details, title });

  await surface.evaluationPanelSwu.open({ title });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  expect(await surface.evaluationPanelSwu.panelLockedAfterConsensus()).toBeFalsy();

  await surface.evaluationPanelSwu.open({ title });
  expect(await surface.evaluationPanelSwu.panelMemberRow()).toBeTruthy();
});
