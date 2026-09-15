// criterion: @R-1.10 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each submission below is complete but for the one field the criterion names, and is made
// as something other than a draft, so it has exactly one reason to be refused.
//
// The refusal is read as nothing having been published: the open opportunities are read
// before the attempt and again after a pause long enough for a slow publication to land, and
// must read the same. A publication the form will not offer at all counts as refused, since
// the action fails rather than waits.
//
// Where the person has typed something that runs too long, the field is named in reply, and
// that is waited for rather than read the instant the value is entered. Where the field is
// simply left blank the person never touched it, so no reason is demanded against it.

const statement =
  "An opportunity that is not a draft is rejected unless it carries a title of 1 to 200 characters, a teaser of at most 500 characters, a location, and a description of 1 to 10,000 characters.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;

function pacificDay(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
}

const complete = {
  title: "R-1.10 an otherwise complete opportunity",
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

async function attemptPublication(surface: Surface, fields: Record<string, unknown>): Promise<void> {
  await surface.opportunityCwuCreate.open();
  try {
    await surface.opportunityCwuCreate.publish(fields);
  } catch {
    // A publication that is not offered is the refusal; what was published is checked below.
  }
}

async function expectNothingPublished(surface: Surface, before: string, title: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  const after = await openOpportunities(surface);
  expect(after).toBe(before);
  if (title) expect(after).not.toContain(title);
}

test(`${statement} (a missing title)`, async ({ surface }) => {
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  await attemptPublication(surface, { ...complete, title: "", location: "R-1.10 Untitled Cove" });

  await expectNothingPublished(surface, before, "");
});

test(`${statement} (a title over 200 characters)`, async ({ surface }) => {
  const title = "R-1.10 title that runs too long ".padEnd(201, "t");
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  await attemptPublication(surface, { ...complete, title });
  await expect.poll(() => surface.opportunityCwuCreate.fieldError(), settle).toBeTruthy();

  await expectNothingPublished(surface, before, title.slice(0, 40));
});

test(`${statement} (a teaser over 500 characters)`, async ({ surface }) => {
  const title = "R-1.10 opportunity whose teaser runs too long";
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  await attemptPublication(surface, { ...complete, title, teaser: "t".repeat(501) });
  await expect.poll(() => surface.opportunityCwuCreate.fieldError(), settle).toBeTruthy();

  await expectNothingPublished(surface, before, title);
});

test(`${statement} (a missing location)`, async ({ surface }) => {
  const title = "R-1.10 opportunity with no location";
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  await attemptPublication(surface, { ...complete, title, location: "" });

  await expectNothingPublished(surface, before, title);
});

test(`${statement} (a missing description)`, async ({ surface }) => {
  const title = "R-1.10 opportunity with no description";
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  await attemptPublication(surface, { ...complete, title, description: "" });

  await expectNothingPublished(surface, before, title);
});

test(`${statement} (a description over 10,000 characters)`, async ({ surface }) => {
  const title = "R-1.10 opportunity whose description runs too long";
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  await attemptPublication(surface, { ...complete, title, description: "d".repeat(10001) });
  await expect.poll(() => surface.opportunityCwuCreate.fieldError(), settle).toBeTruthy();

  await expectNothingPublished(surface, before, title);
});
