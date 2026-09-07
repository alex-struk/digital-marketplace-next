// criterion: @R-1.13 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test builds an opportunity that is complete in every other respect — a phase and
// a question, an evaluation panel, weights that total a hundred — and varies only the
// budget, so a refusal can only be the budget's doing. The last test is the positive
// half of the criterion: a Team With Us budget well above the Sprint With Us ceiling is
// accepted, which is what "no upper limit" means from outside.

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

const sprintDetails = {
  ...shared,
  mandatorySkills: ["Backend Development"],
  questionsWeight: 25,
  codeChallengeWeight: 25,
  teamScenarioWeight: 25,
  priceWeight: 25,
};

const teamDetails = {
  ...shared,
  questionsWeight: 40,
  challengeWeight: 40,
  priceWeight: 20,
};

test("a Sprint With Us opportunity must state a total maximum budget of at most $5,000,000", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.publish({
    ...sprintDetails,
    title: "R-1.13 Sprint With Us opportunity over the budget ceiling",
    totalMaxBudget: 5000001,
  });

  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us opportunity must state a total maximum budget of at least $1", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.publish({
    ...sprintDetails,
    title: "R-1.13 Sprint With Us opportunity with no budget",
    totalMaxBudget: 0,
  });

  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us opportunity must state a maximum budget of at least $1", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await prepareTeamWithUs(surface);
  await surface.opportunityTwuCreate.publish({
    ...teamDetails,
    title: "R-1.13 Team With Us opportunity with no budget",
    maxBudget: 0,
  });

  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us opportunity's maximum budget has no upper limit", async ({ surface }) => {
  const title = "R-1.13 Team With Us opportunity above the Sprint With Us ceiling";
  await surface.signIn(persona.administrator);
  await prepareTeamWithUs(surface);
  await surface.opportunityTwuCreate.publish({ ...teamDetails, title, maxBudget: 9000000 });

  expect(await surface.opportunityTwuCreate.fieldError()).toBeFalsy();
  await surface.opportunityTwuView.open({ title });
  expect((await surface.opportunityTwuView.status()).toLowerCase()).toContain("published");
});
