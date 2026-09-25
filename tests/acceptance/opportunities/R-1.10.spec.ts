// criterion: @R-1.10 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each submission below is a Code With Us opportunity made by an administrator as a
// publication rather than a draft, complete but for the one field the criterion names, so it
// has exactly one reason to be refused.
//
// Being rejected is read two ways, and both must hold. First, the publication is refused: a
// publication the form will not offer at all is the refusal, since the action fails rather
// than waits; where the form does let the value through, the reason is looked for against the
// field where it was entered, and waited for. Where a field is simply left blank no reason is
// demanded, since nothing was typed into it to answer. Second, nothing was published: the open
// opportunities are read before the attempt and again after a pause long enough for a slow
// publication to land, and must read the same.

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

// True when the form would not offer the publication at all.
async function publicationUnavailable(surface: Surface, fields: Record<string, unknown>): Promise<boolean> {
  await surface.opportunityCwuCreate.open();
  try {
    await surface.opportunityCwuCreate.publish(fields);
    return false;
  } catch {
    return true;
  }
}

async function expectReasonGiven(surface: Surface, unavailable: boolean): Promise<void> {
  if (unavailable) return;
  await expect
    .poll(async () => {
      try {
        return await surface.opportunityCwuCreate.fieldError();
      } catch {
        return "";
      }
    }, settle)
    .toBeTruthy();
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

  await publicationUnavailable(surface, { ...complete, title: "", location: "R-1.10 Untitled Cove" });

  await expectNothingPublished(surface, before, "");
});

test(`${statement} (a title over 200 characters)`, async ({ surface }) => {
  const title = "R-1.10 title that runs too long ".padEnd(201, "t");
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  const unavailable = await publicationUnavailable(surface, { ...complete, title });
  await expectReasonGiven(surface, unavailable);

  await expectNothingPublished(surface, before, title.slice(0, 40));
});

test(`${statement} (a teaser over 500 characters)`, async ({ surface }) => {
  const title = "R-1.10 opportunity whose teaser runs too long";
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  const unavailable = await publicationUnavailable(surface, { ...complete, title, teaser: "t".repeat(501) });
  await expectReasonGiven(surface, unavailable);

  await expectNothingPublished(surface, before, title);
});

test(`${statement} (a missing location)`, async ({ surface }) => {
  const title = "R-1.10 opportunity with no location";
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  await publicationUnavailable(surface, { ...complete, title, location: "" });

  await expectNothingPublished(surface, before, title);
});

test(`${statement} (a missing description)`, async ({ surface }) => {
  const title = "R-1.10 opportunity with no description";
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  await publicationUnavailable(surface, { ...complete, title, description: "" });

  await expectNothingPublished(surface, before, title);
});

test(`${statement} (a description over 10,000 characters)`, async ({ surface }) => {
  const title = "R-1.10 opportunity whose description runs too long";
  await surface.signIn(persona.administrator);
  const before = await openOpportunities(surface);

  const unavailable = await publicationUnavailable(surface, { ...complete, title, description: "d".repeat(10001) });
  await expectReasonGiven(surface, unavailable);

  await expectNothingPublished(surface, before, title);
});
