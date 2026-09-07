// criterion: @R-1.53 v2
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// A deletion is read as the opportunity no longer being listed to the person who is
// certain to see it otherwise — its author on the dashboard, or an administrator, who
// sees every opportunity there is. A refusal is read the same way round: it is still
// there afterwards.

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

test("an administrator may delete a draft, in Code With Us, Sprint With Us and Team With Us alike", async ({
  surface,
}) => {
  const codeWithUs = "R-1.53 Code With Us draft an administrator deleted";
  const sprintWithUs = "R-1.53 Sprint With Us draft an administrator deleted";
  const teamWithUs = "R-1.53 Team With Us draft an administrator deleted";

  await surface.signIn(persona.administrator);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: codeWithUs });
  await surface.opportunityCwuEdit.open({ title: codeWithUs });
  await surface.opportunityCwuEdit.deleteOpportunity();

  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title: sprintWithUs });
  await surface.opportunitySwuEdit.open({ title: sprintWithUs });
  await surface.opportunitySwuEdit.deleteOpportunity();

  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.saveDraft({ title: teamWithUs });
  await surface.opportunityTwuEdit.open({ title: teamWithUs });
  await surface.opportunityTwuEdit.deleteOpportunity();

  await surface.opportunityDashboard.open();
  const everything = await surface.opportunityDashboard.allOpportunitiesForAdministrator();
  expect(everything).not.toContain(codeWithUs);
  expect(everything).not.toContain(sprintWithUs);
  expect(everything).not.toContain(teamWithUs);
});

test("an administrator may delete an opportunity that is under review", async ({ surface }) => {
  const title = "R-1.53 opportunity under review an administrator deleted";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({ ...complete, title });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.deleteOpportunity();

  await surface.opportunityDashboard.open();
  expect(await surface.opportunityDashboard.allOpportunitiesForAdministrator()).not.toContain(title);
});

test("the public sector employee who created an opportunity may delete it while it is a draft", async ({
  surface,
}) => {
  const title = "R-1.53 draft its author deleted";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.deleteOpportunity();

  await surface.opportunityDashboard.open();
  expect(await surface.opportunityDashboard.myOpportunitiesTable()).not.toContain(title);
});

test("the public sector employee who created an opportunity may not delete it once it is under review", async ({
  surface,
}) => {
  const title = "R-1.53 opportunity under review its author asked to delete";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({ ...complete, title });
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.deleteOpportunity();

  await surface.opportunityDashboard.open();
  expect(await surface.opportunityDashboard.myOpportunitiesTable()).toContain(title);
});

test("any other request to delete an opportunity is refused and the opportunity remains", async ({
  surface,
}) => {
  const title = "R-1.53 published opportunity an administrator asked to delete";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.deleteOpportunity();

  await surface.opportunityList.open();
  expect(await surface.opportunityList.openGroup()).toContain(title);
});
