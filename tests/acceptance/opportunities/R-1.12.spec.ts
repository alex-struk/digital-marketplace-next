// criterion: @R-1.12 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Three submissions, each complete but for the one thing the criterion bounds. The two
// rewards just outside the range are taken rather than values far outside it, so a form
// that bounded the reward somewhere else would not satisfy them. The criterion promises a
// refusal and nothing about a reason, so no reason is asserted — least of all against a skill
// list the person never touched.
//
// The refusal is read as nothing having been published: after the attempt, and a pause long
// enough for a slow publication to land, the open opportunities must be as they were and must
// not carry the title. A publication the form will not offer at all counts as refused, since
// the action fails rather than waits.

const statement =
  "A Code With Us opportunity must offer a reward of at least $1 and at most $70,000, and must name at least one skill.";

const quietPeriod = 5000;

function pacificDay(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
}

const complete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: pacificDay(14),
  assignmentDate: pacificDay(21),
  startDate: pacificDay(28),
  completionDate: pacificDay(90),
};

async function openOpportunities(surface: Surface): Promise<string> {
  await surface.opportunityList.open();
  return surface.opportunityList.openGroup();
}

async function expectRefused(surface: Surface, fields: Record<string, unknown> & { title: string }): Promise<void> {
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  await surface.opportunityCwuCreate.open();
  try {
    await surface.opportunityCwuCreate.publish(fields);
  } catch {
    // A publication that is not offered is the refusal; what was published is checked below.
  }

  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  const after = await openOpportunities(surface);
  expect(after).not.toContain(fields.title);
  expect(after).toBe(before);
}

test(`${statement} (a reward below $1 is refused)`, async ({ surface }) => {
  await expectRefused(surface, {
    ...complete,
    title: "R-1.12 Code With Us opportunity offering nothing",
    reward: 0,
  });
});

test(`${statement} (a reward above $70,000 is refused)`, async ({ surface }) => {
  await expectRefused(surface, {
    ...complete,
    title: "R-1.12 Code With Us opportunity offering more than the ceiling",
    reward: 70001,
  });
});

test(`${statement} (naming no skill is refused)`, async ({ surface }) => {
  await expectRefused(surface, {
    ...complete,
    title: "R-1.12 Code With Us opportunity naming no skill",
    skills: [],
  });
});
