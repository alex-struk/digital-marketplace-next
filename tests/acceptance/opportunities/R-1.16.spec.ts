// criterion: @R-1.16 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Both opportunities are complete but for their phases, so the refusal can only be the
// phases' doing. The second test offers inception and implementation and withholds
// prototype, which is the exact arrangement the criterion forbids; an opportunity with all
// three phases would tell nothing apart.

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
  mandatorySkills: ["Backend Development"],
  totalMaxBudget: 500000,
  questionsWeight: 25,
  codeChallengeWeight: 40,
  teamScenarioWeight: 15,
  priceWeight: 20,
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

async function prepare(surface: Surface): Promise<void> {
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addTeamQuestion({
    question: "Describe how your team has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel({
    members: [seed.users.staffOne, seed.users.administratorOne],
    chair: seed.users.administratorOne,
  });
}

test("a Sprint With Us opportunity must have an implementation phase", async ({ surface }) => {
  await surface.signIn(persona.administrator);
  await prepare(surface);
  await surface.opportunitySwuCreate.addPhase({
    phase: "Prototype",
    startDate: inDays(28),
    completionDate: inDays(60),
    maxBudget: 250000,
  });
  await surface.opportunitySwuCreate.publish({
    ...shared,
    title: "R-1.16 Sprint With Us opportunity with no implementation phase",
  });

  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us opportunity may only have an inception phase if it also has a prototype phase", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepare(surface);
  await surface.opportunitySwuCreate.addPhase({
    phase: "Inception",
    startDate: inDays(28),
    completionDate: inDays(45),
    maxBudget: 100000,
  });
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(46),
    completionDate: inDays(90),
    maxBudget: 400000,
  });
  await surface.opportunitySwuCreate.publish({
    ...shared,
    title: "R-1.16 Sprint With Us opportunity with inception and no prototype",
  });

  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});
