// criterion: @R-1.19 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The states an opportunity holds are read back from the opportunity itself as it is
// walked along its life. The walk stops at published, and then at cancelled, because the
// evaluation stages, processing and awarded lie beyond a closure the surface cannot
// bring about: an opportunity closes when its proposal deadline passes, nothing here
// makes a deadline pass, and no action closes one by hand (see R-1.1).

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

test("an opportunity moves through the states draft, under review and published", async ({ surface }) => {
  const title = "R-1.19 opportunity walked from draft to published";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("draft");

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.submitForReview();
  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("review");
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.publish();
  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("published");
});

test("an opportunity finally reaches cancelled", async ({ surface }) => {
  const title = "R-1.19 opportunity walked from published to cancelled";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.cancelOpportunity({ note: "Withdrawn by the ministry." });

  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("cancel");
});
