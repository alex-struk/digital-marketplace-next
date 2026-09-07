// criterion: @R-1.17 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion names one rule for both programs, so the required fields are exercised
// on a Sprint With Us team question and the minimum-score rule on a Team With Us
// resource question — the same rule under the two names the programs give it.

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
  await surface.opportunitySwuCreate.setEvaluationPanel(panel);
}

async function prepareTeamWithUs(surface: Surface): Promise<void> {
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    serviceArea: "Full Stack Developer",
    targetAllocation: 100,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
}

test("each evaluation question carries a question, a guideline, a maximum score, a response word limit and a position", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);
  await surface.opportunitySwuCreate.addTeamQuestion({
    question: "Describe how your team has delivered work of this kind before.",
    guideline: "",
    score: 0,
    wordLimit: 0,
    order: 101,
  });
  await surface.opportunitySwuCreate.publish({
    ...shared,
    title: "R-1.17 Sprint With Us opportunity with an incomplete team question",
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 1000000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
  });

  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("an evaluation question's optional minimum score must be lower than the question's maximum score", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareTeamWithUs(surface);
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    minimumScore: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.publish({
    ...shared,
    title: "R-1.17 Team With Us opportunity whose minimum score matches its maximum",
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
  });

  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});
