// criterion: @R-1.15 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Both opportunities are complete in every other respect, so the refusal read from the
// weights observation can only be the weights' doing. Sprint With Us weights four stages
// and Team With Us three, and each set is made to total ninety-nine.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const shared = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
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

async function prepareTeamWithUs(surface: Surface): Promise<void> {
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    serviceArea: "Full Stack Developer",
    targetAllocation: 100,
  });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
}

test("a Sprint With Us opportunity is rejected unless its evaluation weights total exactly one hundred per cent", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.publish({
    ...shared,
    title: "R-1.15 Sprint With Us opportunity whose weights fall short",
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 1000000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 24,
  });

  expect(await surface.opportunitySwuCreate.scoreWeightError()).toBeTruthy();
});

test("a Team With Us opportunity is rejected unless its evaluation weights total exactly one hundred per cent", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareTeamWithUs(surface);
  await surface.opportunityTwuCreate.publish({
    ...shared,
    title: "R-1.15 Team With Us opportunity whose weights fall short",
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 19,
  });

  expect(await surface.opportunityTwuCreate.scoreWeightError()).toBeTruthy();
});
