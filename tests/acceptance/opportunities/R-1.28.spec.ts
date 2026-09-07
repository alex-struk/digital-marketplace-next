// criterion: @R-1.28 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// Each test cancels an opportunity of its own rather than the seeded one, which the rest
// of the suite needs left published. The refusals are read as the opportunity's state
// being unchanged: the management surface names no error observation.

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

test("an administrator may cancel a published opportunity", async ({ surface }) => {
  const title = "R-1.28 published opportunity an administrator cancelled";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.cancelOpportunity({ note: "The work is no longer needed." });

  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("cancel");
});

test("only an administrator may cancel an opportunity", async ({ surface }) => {
  const title = "R-1.28 published opportunity its author asked to cancel";

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
  await surface.opportunityCwuEdit.cancelOpportunity({ note: "The work is no longer needed." });

  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("published");
});

test("an opportunity may be cancelled only once it has been published", async ({ surface }) => {
  const title = "R-1.28 draft an administrator asked to cancel";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.cancelOpportunity({ note: "The work is no longer needed." });

  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("draft");
});
