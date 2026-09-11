// criterion: @R-1.4 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// A new version is not something the surface names directly. What it does name is the
// opportunity's own content and its history, so the two halves of the criterion are read
// as the content having moved on and the history having gained something it did not hold
// before. The retained previous content is not asserted: nothing in the surface offers an
// earlier version of an opportunity to read back.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "R-1.4 the description as it stood when the opportunity was published.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

test("every change to an opportunity's content creates a new version of it and the opportunity always shows its most recent version", async ({
  surface,
}) => {
  const title = "R-1.4 published opportunity whose description was changed";
  const changed = "R-1.4 the description as the administrator changed it.";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.editDetails({ description: changed });

  await surface.opportunityCwuEdit.open({ opportunityId });
  const shown = await surface.opportunityCwuEdit.opportunityTab();
  expect(shown).toContain(changed);
  expect(shown).not.toContain(complete.description);
});

test("every change to an opportunity's content records an edit in its history", async ({
  surface,
}) => {
  const title = "R-1.4 published opportunity whose history records the change";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  const before = await surface.opportunityCwuEdit.historyTab();

  await surface.opportunityCwuEdit.editDetails({
    description: "R-1.4 a description offered so that the history has an edit to record.",
  });

  await surface.opportunityCwuEdit.open({ opportunityId });
  const after = await surface.opportunityCwuEdit.historyTab();
  expect(after).not.toBe(before);
  expect(after.length).toBeGreaterThan(before.length);
});
