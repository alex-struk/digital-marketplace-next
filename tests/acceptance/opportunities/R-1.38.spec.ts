// criterion: @R-1.38 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Ordering is asserted by where two opportunities of the test's own fall relative to each
// other in the group's text, which holds whatever else the list is showing at the time.
//
// The closed group is not asserted. An opportunity counts as closed once it is published
// and past its proposal deadline, and nothing in the surface makes a deadline pass or
// closes an opportunity by hand (see R-1.1), so no opportunity can be put in that group.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  assignmentDate: inDays(200),
  startDate: inDays(210),
  completionDate: inDays(300),
};

test("the opportunity list shows open opportunities with the nearest proposal deadline first", async ({
  surface,
}) => {
  const sooner = "R-1.38 open opportunity whose deadline is sooner";
  const later = "R-1.38 open opportunity whose deadline is later";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: later, proposalDeadline: inDays(120) });
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: sooner, proposalDeadline: inDays(60) });

  await surface.opportunityList.open();
  const open = await surface.opportunityList.openGroup();
  expect(open).toContain(sooner);
  expect(open).toContain(later);
  expect(open.indexOf(sooner)).toBeLessThan(open.indexOf(later));
  expect(await surface.opportunityList.unpublishedGroup()).not.toContain(sooner);
});

test("the opportunity list groups unpublished opportunities apart, most recently changed first", async ({
  surface,
}) => {
  const older = "R-1.38 unpublished opportunity changed earlier";
  const newer = "R-1.38 unpublished opportunity changed later";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: older });
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: newer });

  await surface.opportunityList.open();
  const unpublished = await surface.opportunityList.unpublishedGroup();
  expect(unpublished).toContain(older);
  expect(unpublished).toContain(newer);
  expect(unpublished.indexOf(newer)).toBeLessThan(unpublished.indexOf(older));
  expect(await surface.opportunityList.openGroup()).not.toContain(newer);
});
