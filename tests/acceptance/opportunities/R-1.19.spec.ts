// criterion: @R-1.19 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The states an opportunity holds are read back from the opportunity itself as it is
// walked along its life. Three of them — draft, under review and published — are walked on
// an opportunity of the test's own; the evaluation stage is read off a seeded opportunity
// that the closing hook moves on, because no form accepts a deadline already gone by; and
// cancelled is walked on an opportunity of the test's own again.
//
// Processing and awarded are not asserted here. Both lie past a whole evaluation run on
// the one seeded opportunity of each program, and each is the subject of a criterion of its
// own.

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

test("an opportunity moves through the states draft, under review and published", async ({
  surface,
}) => {
  const title = "R-1.19 opportunity walked from draft to published";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("draft");

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.submitForReview();
  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("review");
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.publish();
  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("published");
});

test("an opportunity moves on to a program-specific evaluation stage", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuView.open({ opportunityId: seed.opportunities.closedSprintWithUs.id });
  expect((await surface.opportunitySwuView.status()).toLowerCase()).toMatch(/evaluat|question/);
});

test("an opportunity finally reaches cancelled", async ({ surface }) => {
  const title = "R-1.19 opportunity walked from published to cancelled";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.cancelOpportunity({ note: "Withdrawn by the ministry." });

  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("cancel");
});
