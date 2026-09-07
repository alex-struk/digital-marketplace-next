// criterion: @R-1.37 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The seed holds one administrator, so "every administrator" is that one address; a
// larger set of administrators cannot be made, since accounts arrive only by signing in
// as a seeded persona.

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

test("submitting an opportunity for review notifies every administrator", async ({ surface, mail }) => {
  const title = "R-1.37 opportunity submitted for review, which administrators are told of";
  const administrator = seed.users.administratorOne.email;
  const before = (await mail.messagesTo(administrator)).length;

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.submitForReview();

  await expect
    .poll(async () => (await mail.messagesTo(administrator)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});

test("submitting an opportunity for review confirms the submission to its author", async ({
  surface,
  mail,
}) => {
  const title = "R-1.37 opportunity submitted for review, which its author is confirmed of";
  const author = seed.users.staffOne.email;
  const before = (await mail.messagesTo(author)).length;

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.submitForReview();

  await expect
    .poll(async () => (await mail.messagesTo(author)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});
