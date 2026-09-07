// criterion: @R-1.16 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Both submissions are complete but for their phases: the first offers a prototype phase
// and no implementation phase, the second an inception phase with no prototype to follow
// it.

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
  completionDate: inDays(120),
  mandatorySkills: ["Backend Development"],
  totalMaxBudget: 1000000,
  questionsWeight: 25,
  codeChallengeWeight: 25,
  teamScenarioWeight: 25,
  priceWeight: 25,
};

async function prepareWithoutPhases(surface: Surface): Promise<void> {
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({
    question: "Describe how your team has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel({
    members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
    chair: seed.users.staffPanelEvaluator,
  });
}

test("a Sprint With Us opportunity must have an implementation phase", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await prepareWithoutPhases(surface);
  await surface.opportunitySwuCreate.addPhase({
    phase: "Prototype",
    startDate: inDays(28),
    completionDate: inDays(60),
    maxBudget: 300000,
  });
  await surface.opportunitySwuCreate.publish({
    ...details,
    title: "R-1.16 Sprint With Us opportunity with no implementation phase",
  });

  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us opportunity may only have an inception phase if it also has a prototype phase", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepareWithoutPhases(surface);
  await surface.opportunitySwuCreate.addPhase({
    phase: "Inception",
    startDate: inDays(28),
    completionDate: inDays(60),
    maxBudget: 200000,
  });
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(61),
    completionDate: inDays(120),
    maxBudget: 500000,
  });
  await surface.opportunitySwuCreate.publish({
    ...details,
    title: "R-1.16 Sprint With Us opportunity with an inception phase and no prototype",
  });

  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});
