// criterion: @R-1.14 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Four submissions, each with exactly one date out of its place, so a form that only checked
// the first pair would fail the later ones. Days are counted in Pacific time, which is the
// clock the criterion names, so "yesterday" is yesterday there whatever the machine's own
// clock says. The criterion promises a refusal and nothing about a reason, so no reason is
// asserted.
//
// The refusal is read as nothing having been published: after the attempt, and a pause long
// enough for a slow publication to land, the open opportunities must be as they were and must
// not carry the title. A publication the form will not offer at all counts as refused, since
// the action fails rather than waits.
//
// The last test reads the deadline back off a published opportunity. The deadline
// observation returns free text in no stated shape, so four in the afternoon is looked for in
// either of the two ways a clock time is ordinarily written. It is the only one of the four
// dates any observation returns; the assignment, start and completion dates are not read.

const statement =
  "An opportunity's key dates must run in order — the proposal deadline no earlier than today, then the assignment date, then the start date, then the completion date — and each date is recorded as 4:00 p.m. Pacific time on the day chosen.";

const settle = { timeout: 15000 };
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

test(`${statement} (a proposal deadline earlier than today is refused)`, async ({ surface }) => {
  await expectRefused(surface, {
    ...complete,
    title: "R-1.14 opportunity whose deadline has already gone by",
    proposalDeadline: pacificDay(-1),
  });
});

test(`${statement} (an assignment date before the proposal deadline is refused)`, async ({ surface }) => {
  await expectRefused(surface, {
    ...complete,
    title: "R-1.14 opportunity assigned before proposals close",
    assignmentDate: pacificDay(13),
  });
});

test(`${statement} (a start date before the assignment date is refused)`, async ({ surface }) => {
  await expectRefused(surface, {
    ...complete,
    title: "R-1.14 opportunity starting before it is assigned",
    startDate: pacificDay(20),
  });
});

test(`${statement} (a completion date before the start date is refused)`, async ({ surface }) => {
  await expectRefused(surface, {
    ...complete,
    title: "R-1.14 opportunity completed before it starts",
    completionDate: pacificDay(27),
  });
});

test(`${statement} (the proposal deadline is recorded as 4:00 p.m. on the day chosen)`, async ({ surface }) => {
  const title = "R-1.14 opportunity whose deadline is read back for its time of day";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuView.open({ opportunityId });
  await expect.poll(() => surface.opportunityCwuView.proposalDeadline(), settle).toMatch(/4:00|16:00/);
});
