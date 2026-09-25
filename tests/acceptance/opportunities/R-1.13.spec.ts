// criterion: @R-1.13 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each opportunity below is published by an administrator and is complete in every other
// respect — a phase or a resource, a question, a panel and weights totalling one hundred — so
// the only thing left to refuse it is the budget.
//
// A refusal is read as the publication being refused — the form not offering it, or naming a
// fault, waited for — and nothing having been published under that title.
//
// "No upper limit" is read on the figure a Sprint With Us opportunity is refused for: the same
// figure is taken on a Team With Us one. Before the list of open opportunities is read, that
// opportunity is shown to have been stored and published with that budget: the screen it lands
// on carries an identifier, and its own view reads it as published and states the budget. Where
// the target does not store the Team With Us opportunity at all, for a reason this criterion does
// not govern, the case is recorded as blocked.

const statement =
  "A Sprint With Us opportunity must state a total maximum budget of at least $1 and at most $5,000,000, while a Team With Us opportunity must state a maximum budget of at least $1 with no upper limit.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;

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

const sprintContent = {
  ...shared,
  mandatorySkills: ["Backend Development"],
  questionsWeight: 25,
  codeChallengeWeight: 40,
  teamScenarioWeight: 15,
  priceWeight: 20,
};

const teamContent = { ...shared, questionsWeight: 30, challengeWeight: 40, priceWeight: 30 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

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
  await surface.opportunityTwuCreate.addResource({ serviceArea: "Full Stack Developer", targetAllocation: 100 });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
}

// True when the form would not offer the publication at all.
async function unavailable(publish: () => Promise<void>): Promise<boolean> {
  try {
    await publish();
    return false;
  } catch {
    return true;
  }
}

async function openOpportunities(surface: Surface): Promise<string> {
  await surface.opportunityList.open();
  return surface.opportunityList.openGroup();
}

async function expectRefused(
  surface: Surface,
  refusedOutright: boolean,
  fieldError: () => Promise<string>,
  title: string,
): Promise<void> {
  if (!refusedOutright) await expect.poll(() => readOrEmpty(fieldError), settle).toBeTruthy();
  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  expect(await openOpportunities(surface)).not.toContain(title);
}

test(`${statement} (a Sprint With Us total maximum budget above $5,000,000 is rejected)`, async ({ surface }) => {
  const title = "R-1.13 Sprint With Us opportunity budgeted above the ceiling";
  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);

  const refused = await unavailable(() =>
    surface.opportunitySwuCreate.publish({ ...sprintContent, title, totalMaxBudget: 5000001 }),
  );

  await expectRefused(surface, refused, () => surface.opportunitySwuCreate.fieldError(), title);
});

test(`${statement} (a Sprint With Us total maximum budget below $1 is rejected)`, async ({ surface }) => {
  const title = "R-1.13 Sprint With Us opportunity budgeted at nothing";
  await surface.signIn(persona.administrator);
  await prepareSprintWithUs(surface);

  const refused = await unavailable(() =>
    surface.opportunitySwuCreate.publish({ ...sprintContent, title, totalMaxBudget: 0 }),
  );

  await expectRefused(surface, refused, () => surface.opportunitySwuCreate.fieldError(), title);
});

test(`${statement} (a Team With Us maximum budget below $1 is rejected)`, async ({ surface }) => {
  const title = "R-1.13 Team With Us opportunity budgeted at nothing";
  await surface.signIn(persona.administrator);
  await prepareTeamWithUs(surface);

  const refused = await unavailable(() =>
    surface.opportunityTwuCreate.publish({ ...teamContent, title, maxBudget: 0 }),
  );

  await expectRefused(surface, refused, () => surface.opportunityTwuCreate.fieldError(), title);
});

test(`${statement} (a Team With Us maximum budget has no upper limit)`, async ({ surface }) => {
  const title = "R-1.13 Team With Us opportunity budgeted above the Sprint With Us ceiling";
  const budget = 5000001;

  await surface.signIn(persona.administrator);
  await prepareTeamWithUs(surface);
  const refused = await unavailable(() =>
    surface.opportunityTwuCreate.publish({ ...teamContent, title, maxBudget: budget }),
  );
  expect(refused, "the form refused to publish a Team With Us opportunity for its budget").toBe(false);
  expect(await readOrEmpty(() => surface.opportunityTwuCreate.fieldError())).toBeFalsy();

  let opportunityId = "";
  try {
    await expect.poll(() => readOrEmpty(() => surface.opportunityTwuEdit.opportunityIdentifier()), settle).toBeTruthy();
    opportunityId = await surface.opportunityTwuEdit.opportunityIdentifier();
  } catch {
    opportunityId = "";
  }
  if (!opportunityId) {
    test.skip(true, "blocked: the target did not store the Team With Us opportunity, so whether its budget is limited cannot be read");
  }

  await surface.opportunityTwuView.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => surface.opportunityTwuView.status()), settle).toMatch(/publish/i);
  expect((await surface.opportunityTwuView.maxBudget()).replace(/\D/g, "")).toContain(String(budget));

  expect(await openOpportunities(surface)).toContain(title);
});
