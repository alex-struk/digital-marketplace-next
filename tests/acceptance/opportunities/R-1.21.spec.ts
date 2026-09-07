// criterion: @R-1.21 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The draft is complete but for its description, so a refusal can only be that field's
// doing — and what the author is told must not name it. The refusal itself is read as
// the opportunity staying a draft, since its management surface names no error
// observation; the wording is read from the creation form, which does.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const incomplete = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

test("submitting a draft opportunity for review is refused unless the opportunity is complete", async ({
  surface,
}) => {
  const title = "R-1.21 draft submitted for review with a field still blank";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...incomplete, title });

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.submitForReview();

  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("draft");
});

test("the person is told the opportunity is incomplete rather than which field is missing", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({
    ...incomplete,
    title: "R-1.21 opportunity submitted for review and told it is incomplete",
  });

  const message = await surface.opportunityCwuCreate.fieldError();
  expect(message).toBeTruthy();
  expect(message.toLowerCase()).toContain("incomplete");
  expect(message.toLowerCase()).not.toContain("description");
});
