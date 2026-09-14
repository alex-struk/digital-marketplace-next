// criterion: @R-1.13 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each opportunity below is complete in every other respect — a phase or a resource, a
// question, a panel and weights totalling one hundred — so the only thing left to refuse a
// submission is the budget. The last test is the one the criterion turns on: the same
// figure that a Sprint With Us opportunity is refused for is accepted on a Team With Us
// one, which is what "no upper limit" means when nothing reports a limit directly.

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
  members: [seed.users.staffOne, seed.users.administratorOne],
  chair: seed.users.administratorOne,
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

const sprintWeights = {
  questionsWeight: 25,
  codeChallengeWeight: 40,
  teamScenarioWeight: 15,
  priceWeight: 20,
};

const teamWeights = { questionsWeight: 30, challengeWeight: 40, priceWeight: 30 };

test("a Sprint With Us opportunity stating a total maximum budget above five million dollars is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.publish({
    ...shared,
    ...sprintWeights,
    title: "R-1.13 Sprint With Us opportunity budgeted above the ceiling",
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 5000001,
  });
  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us opportunity stating a total maximum budget below one dollar is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.publish({
    ...shared,
    ...sprintWeights,
    title: "R-1.13 Sprint With Us opportunity budgeted at nothing",
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 0,
  });
  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us opportunity stating a maximum budget below one dollar is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareTeamWithUs(surface);
  await surface.opportunityTwuCreate.publish({
    ...shared,
    ...teamWeights,
    title: "R-1.13 Team With Us opportunity budgeted at nothing",
    maxBudget: 0,
  });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us opportunity may state a maximum budget with no upper limit", async ({
  surface,
}) => {
  const title = "R-1.13 Team With Us opportunity budgeted above the Sprint With Us ceiling";

  await surface.signIn(persona.administrator);
  await prepareTeamWithUs(surface);
  await surface.opportunityTwuCreate.publish({
    ...shared,
    ...teamWeights,
    title,
    maxBudget: 5000001,
  });

  expect(await surface.opportunityTwuCreate.fieldError()).toBeFalsy();
  await surface.opportunityList.open();
  expect(await surface.opportunityList.openGroup()).toContain(title);
});
