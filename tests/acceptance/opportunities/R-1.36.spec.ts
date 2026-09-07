// criterion: @R-1.36 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The opportunity is drafted by a member of public sector staff and published and then
// cancelled by an administrator, so the author who is separately notified is not the
// person who cancelled it. It is an opportunity of the test's own rather than the seeded
// one, which the rest of the suite needs left published.
//
// The watchers and the proponents are not asserted: they are told as a group in blind
// copies, which the mail fixture cannot search (mail.messagesTo takes one visible
// address).

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

test("cancelling an opportunity separately notifies its author", async ({ surface, mail }) => {
  const title = "R-1.36 opportunity whose author is told it was cancelled";
  const author = seed.users.staffOne.email;

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.publish();

  const before = (await mail.messagesTo(author)).length;
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.cancelOpportunity({ note: "The work is no longer needed." });

  await expect
    .poll(async () => (await mail.messagesTo(author)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});
