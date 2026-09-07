// criterion: @R-1.48 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The content offered is complete, so nothing but the requester's standing is left to
// refuse the creation. The refusal is read by an administrator afterwards, because only
// an administrator is certain to see an opportunity in whatever state it did or did not
// reach.

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
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

test("creating an opportunity with its state set to published is refused unless the requester is an administrator", async ({
  surface,
}) => {
  const title = "R-1.48 opportunity an ordinary member of staff tried to create as published";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityList.open();
  expect(await surface.opportunityList.openGroup()).not.toContain(title);
});

test("a public sector employee who is not an administrator may create an opportunity as a draft or under review, in all three programs", async ({
  surface,
}) => {
  const codeWithUs = "R-1.48 Code With Us draft created by an ordinary member of staff";
  const sprintWithUs = "R-1.48 Sprint With Us draft created by an ordinary member of staff";
  const teamWithUs = "R-1.48 Team With Us draft created by an ordinary member of staff";
  const underReview = "R-1.48 Code With Us opportunity created under review";

  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: codeWithUs });
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title: sprintWithUs });
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.saveDraft({ title: teamWithUs });

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({ ...complete, title: underReview });

  await surface.opportunityList.open();
  const unpublished = await surface.opportunityList.unpublishedGroup();
  expect(unpublished).toContain(codeWithUs);
  expect(unpublished).toContain(sprintWithUs);
  expect(unpublished).toContain(teamWithUs);
  expect(unpublished).toContain(underReview);
});
