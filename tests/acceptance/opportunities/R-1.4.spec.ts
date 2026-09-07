// criterion: @R-1.4 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Each test publishes an opportunity of its own rather than editing the seeded one, so
// that the history it reads back holds only the change the test made.
//
// That the previous content is retained is not asserted: no observation returns an
// earlier version of an opportunity, only the one it shows now and the entries in its
// history.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const completeDetails = {
  teaser: "Work on the departmental scheduling service.",
  location: "Victoria",
  description: "The original description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(35),
};

test("every change to an opportunity's content creates a new version of it and records an edit in its history", async ({
  surface,
}) => {
  const title = "R-1.4 opportunity whose history records an edit";
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...completeDetails, title });

  await surface.opportunityCwuEdit.open({ title });
  const historyBefore = await surface.opportunityCwuEdit.historyTab();

  await surface.opportunityCwuEdit.editDetails({ description: "The description as it was changed by an administrator." });

  const historyAfter = await surface.opportunityCwuEdit.historyTab();
  expect(historyAfter).toBeTruthy();
  expect(historyAfter).not.toBe(historyBefore);
});

test("the opportunity always shows its most recent version", async ({ surface }) => {
  const title = "R-1.4 opportunity that shows its most recent version";
  const changed = "The description as it was changed by an administrator.";
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...completeDetails, title });

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.editDetails({ description: changed });

  await surface.opportunityCwuEdit.open({ title });
  const shown = await surface.opportunityCwuEdit.opportunityTab();
  expect(shown).toContain(changed);
  expect(shown).not.toContain(completeDetails.description);
});
