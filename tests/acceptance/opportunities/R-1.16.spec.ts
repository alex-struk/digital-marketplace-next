// criterion: @R-1.16 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Both opportunities are complete but for their phases, so what happens to them can only
// be the phases' doing. Every phase is valid on its own: each names the capability it
// needs, starts well after the assignment date and well after the completion of any
// phase before it, finishes after it starts, and the phase budgets sum to less than the
// opportunity's total. No gap between phases is left tight enough for a date check to be
// the fault.
//
// The first names no implementation phase of its own and is published. The rule is kept
// if no Sprint With Us opportunity ends up published without one — whether because the
// service gives the person no way to leave it out, or because it refuses the publication —
// so the test does not demand a refusal message. If the opportunity was published, its
// phases must include an implementation phase; if it was not, it must not be among the
// opportunities at all.
//
// The second offers inception and implementation and withholds prototype, the exact
// arrangement the criterion forbids. It is refused with a message saying a prototype phase
// must follow an inception phase, and the opportunity does not end up published.
//
// Only the identifier read is allowed to fail: a person turned away from the create page
// is never taken to an edit page, so there is no identifier to read.

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
  totalMaxBudget: 1000000,
  questionsWeight: 25,
  codeChallengeWeight: 40,
  teamScenarioWeight: 15,
  priceWeight: 20,
  proposalDeadline: pacificDay(14),
  assignmentDate: pacificDay(21),
};

// The identifier of the opportunity the person was taken to, or "" when the submission
// left them without one.
async function landedOpportunityId(surface: Surface): Promise<string> {
  try {
    return (await surface.opportunitySwuEdit.opportunityIdentifier()) ?? "";
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
    startDate: pacificDay(30),
    completionDate: pacificDay(60),
    maxBudget: 250000,
    capabilities: ["Frontend Development"],
  });
  await surface.opportunitySwuCreate.publish({ ...shared, title });

  const opportunityId = await landedOpportunityId(surface);
  if (opportunityId) {
    await surface.opportunitySwuView.open({ opportunityId });
    expect(await surface.opportunitySwuView.phases()).toMatch(/implementation/i);
  } else {
    await surface.opportunityDashboard.open();
    expect(await surface.opportunityDashboard.myOpportunitiesTable()).not.toContain(title);
  }
});

test("A Sprint With Us opportunity may only have an inception phase if it also has a prototype phase", async ({
  surface,
}) => {
  const title = "R-1.16 Sprint With Us opportunity with inception and no prototype";

  await surface.signIn(persona.administrator);
  await prepare(surface);
  await surface.opportunitySwuCreate.addPhase({
    phase: "Inception",
    startDate: pacificDay(30),
    completionDate: pacificDay(45),
    maxBudget: 100000,
    capabilities: ["Frontend Development"],
  });
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: pacificDay(60),
    completionDate: pacificDay(120),
    maxBudget: 400000,
    capabilities: ["Frontend Development"],
  });
  await surface.opportunitySwuCreate.publish({ ...shared, title });

  const refusal = await surface.opportunitySwuCreate.fieldError();
  expect(refusal).toMatch(/prototype/i);
  expect(refusal).toMatch(/inception/i);

  const opportunityId = await landedOpportunityId(surface);
  if (opportunityId) {
    await surface.opportunitySwuView.open({ opportunityId });
    expect(await surface.opportunitySwuView.status()).not.toMatch(/published/i);
  } else {
    await surface.opportunityDashboard.open();
    expect(await surface.opportunityDashboard.myOpportunitiesTable()).not.toContain(title);
  }
});
