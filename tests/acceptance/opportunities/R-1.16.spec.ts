// criterion: @R-1.16 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Both opportunities are complete but for their phases, so what happens to them can only
// be the phases' doing.
//
// The first names no implementation phase of its own and is published. The rule is kept
// if no Sprint With Us opportunity ends up published without one — whether because the
// service gives the person no way to leave it out, or because it refuses the publication —
// so the test does not demand a refusal message. If the opportunity was published, its
// phases must include an implementation phase; if it was not, it must not be among the
// opportunities at all.
//
// The second offers inception and implementation and withholds prototype, the exact
// arrangement the criterion forbids, and is refused.

function pacificDay(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
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
  proposalDeadline: pacificDay(14),
  assignmentDate: pacificDay(21),
  startDate: pacificDay(28),
  completionDate: pacificDay(90),
};

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

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

test("A Sprint With Us opportunity must have an implementation phase", async ({ surface }) => {
  const title = "R-1.16 Sprint With Us opportunity naming no implementation phase";

  await surface.signIn(persona.administrator);
  await prepare(surface);
  await surface.opportunitySwuCreate.addPhase({
    phase: "Prototype",
    startDate: pacificDay(28),
    completionDate: pacificDay(60),
    maxBudget: 250000,
  });
  await surface.opportunitySwuCreate.publish({ ...shared, title });

  const opportunityId = await readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier());
  if (opportunityId) {
    await surface.opportunitySwuView.open({ opportunityId });
    expect(await surface.opportunitySwuView.phases()).toMatch(/implementation/i);
  } else {
    await surface.opportunityDashboard.open();
    expect(await readOrEmpty(() => surface.opportunityDashboard.myOpportunitiesTable())).not.toContain(title);
  }
});

test("A Sprint With Us opportunity may only have an inception phase if it also has a prototype phase", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await prepare(surface);
  await surface.opportunitySwuCreate.addPhase({
    phase: "Inception",
    startDate: pacificDay(28),
    completionDate: pacificDay(45),
    maxBudget: 100000,
  });
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: pacificDay(46),
    completionDate: pacificDay(90),
    maxBudget: 400000,
  });
  await surface.opportunitySwuCreate.publish({
    ...shared,
    title: "R-1.16 Sprint With Us opportunity with inception and no prototype",
  });

  expect(await surface.opportunitySwuCreate.fieldError()).toBeTruthy();
});
