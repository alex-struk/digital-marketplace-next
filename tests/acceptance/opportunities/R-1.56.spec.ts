// criterion: @R-1.56 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The opportunity is drafted by a member of public sector staff and published by an
// administrator, so the person whose change is refused is the employee who created it.
// The refusal is read as the opportunity still showing what it showed before: its
// management surface names no error observation.
//
// Only Code With Us is exercised, so the criterion's claim that the same rule governs all
// three programs is asserted for one of them. The rule turns on who is asking rather than
// on what the opportunity holds, and the other two programs reach published only through
// their phases or resources, questions, weights and panel.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "The description as it stood when the opportunity was published.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

test("once an opportunity is published, a request to change its details from the public sector employee who created it is refused", async ({
  surface,
}) => {
  const title = "R-1.56 published opportunity its author tried to change";
  const attempted = "R-1.56 the description its author tried to put there.";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.editDetails({ description: attempted });

  await surface.signOut();
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ title });
  const shown = await surface.opportunityCwuEdit.opportunityTab();
  expect(shown).not.toContain(attempted);
  expect(shown).toContain(complete.description);
});

test("once an opportunity is published, an administrator may change its details", async ({ surface }) => {
  const title = "R-1.56 published opportunity an administrator changed";
  const changed = "R-1.56 the description an administrator put there.";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.editDetails({ description: changed });

  await surface.opportunityCwuEdit.open({ title });
  expect(await surface.opportunityCwuEdit.opportunityTab()).toContain(changed);
});
