// criterion: @R-1.11 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each submission is complete but for the remote-work fields, and each is made as something
// other than a draft, so it has exactly one reason to be refused. The criterion promises a
// refusal and nothing about a reason, so no reason is asserted.
//
// The refusal is read as nothing having been published: after the attempt, and a pause long
// enough for a slow publication to land, the open opportunities must be as they were and must
// not carry the title. A publication the form will not offer at all counts as refused, since
// the action fails rather than waits.

const statement =
  "An opportunity that is not a draft must state whether remote work is acceptable, and must carry a remote-work description of up to 500 characters whenever remote work is acceptable.";

const quietPeriod = 5000;

function pacificDay(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
}

const complete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
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

test(`${statement} (one that does not say whether remote work is acceptable is refused)`, async ({ surface }) => {
  await expectRefused(surface, {
    ...complete,
    title: "R-1.11 opportunity that says nothing about remote work",
  });
});

test(`${statement} (one that accepts remote work with no remote-work description is refused)`, async ({ surface }) => {
  await expectRefused(surface, {
    ...complete,
    title: "R-1.11 opportunity accepting remote work with nothing said about it",
    remoteOk: true,
    remoteDescription: "",
  });
});

test(`${statement} (one that accepts remote work with a remote-work description over 500 characters is refused)`, async ({
  surface,
}) => {
  await expectRefused(surface, {
    ...complete,
    title: "R-1.11 opportunity whose remote-work description runs too long",
    remoteOk: true,
    remoteDescription: "r".repeat(501),
  });
});
