// criterion: @R-1.56 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The opportunity is drafted by a member of public sector staff and published by an
// administrator, so the person whose change is refused is the employee who created it. The
// refusal is read as the opportunity still showing what it showed before: its management
// surface names no error observation.
//
// The criterion says the same rule governs all three programs, so the refusal is taken in
// all three. Sprint With Us and Team With Us reach published only through their phases or
// resources, their questions, their weights and their panel, so each draft below carries
// those before an administrator publishes it.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const shared = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "R-1.56 the description as it stood when the opportunity was published.",
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

const attempted = "R-1.56 the description its author tried to put there.";

async function publishedCodeWithUs(surface: Surface, title: string): Promise<string> {
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({
    ...shared,
    title,
    reward: 5000,
    skills: ["Backend Development"],
  });
  return surface.opportunityCwuEdit.opportunityIdentifier();
}

async function publishedSprintWithUs(surface: Surface, title: string): Promise<string> {
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
  await surface.opportunitySwuCreate.saveDraft({
    ...shared,
    title,
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 40,
    teamScenarioWeight: 15,
    priceWeight: 20,
  });
  return surface.opportunitySwuEdit.opportunityIdentifier();
}

async function publishedTeamWithUs(surface: Surface, title: string): Promise<string> {
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
  await surface.opportunityTwuCreate.saveDraft({
    ...shared,
    title,
    maxBudget: 300000,
    questionsWeight: 30,
    challengeWeight: 40,
    priceWeight: 30,
  });
  return surface.opportunityTwuEdit.opportunityIdentifier();
}

test("once an opportunity is published, an administrator may change its details", async ({
  surface,
}) => {
  const title = "R-1.56 published opportunity an administrator changed";
  const changed = "R-1.56 the description an administrator put there.";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...shared,
    title,
    reward: 5000,
    skills: ["Backend Development"],
  });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.editDetails({ description: changed });

  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.opportunityTab()).toContain(changed);
});

test("once an opportunity is published, a request to change its details from the public sector employee who created it is refused", async ({
  surface,
}) => {
  const title = "R-1.56 published Code With Us opportunity its author tried to change";

  await surface.signIn(persona.publicSectorStaff);
  const opportunityId = await publishedCodeWithUs(surface, title);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.editDetails({ description: attempted });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  const shown = await surface.opportunityCwuEdit.opportunityTab();
  expect(shown).not.toContain(attempted);
  expect(shown).toContain(shared.description);
});

test("the same rule governs a published Sprint With Us opportunity", async ({ surface }) => {
  const title = "R-1.56 published Sprint With Us opportunity its author tried to change";

  await surface.signIn(persona.publicSectorStaff);
  const opportunityId = await publishedSprintWithUs(surface, title);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ opportunityId });
  await surface.opportunitySwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuEdit.open({ opportunityId });
  await surface.opportunitySwuEdit.editDetails({ description: attempted });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ opportunityId });
  const shown = await surface.opportunitySwuEdit.opportunityTab();
  expect(shown).not.toContain(attempted);
  expect(shown).toContain(shared.description);
});

test("the same rule governs a published Team With Us opportunity", async ({ surface }) => {
  const title = "R-1.56 published Team With Us opportunity its author tried to change";

  await surface.signIn(persona.publicSectorStaff);
  const opportunityId = await publishedTeamWithUs(surface, title);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuEdit.open({ opportunityId });
  await surface.opportunityTwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityTwuEdit.open({ opportunityId });
  await surface.opportunityTwuEdit.editDetails({ description: attempted });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuEdit.open({ opportunityId });
  const shown = await surface.opportunityTwuEdit.opportunityTab();
  expect(shown).not.toContain(attempted);
  expect(shown).toContain(shared.description);
});
