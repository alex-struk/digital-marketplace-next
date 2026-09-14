// criterion: @R-1.36 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The opportunity is drafted by a member of public sector staff and published and cancelled
// by an administrator, so the notice the criterion says goes to the author separately can be
// told from the mail of the person who did the cancelling.
//
// The watchers and the proponents are not asserted. Both are told as a group, in blind
// copies, and the mail fixture searches by visible recipient only, so a message that did
// reach one of them would not be found.

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

test("cancelling an opportunity notifies its author", async ({ surface, mail }) => {
  const title = "R-1.36 opportunity whose author is told it was cancelled";
  const author = seed.users.staffOne.email;

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.publish();

  const before = (await mail.messagesTo(author)).length;

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.cancelOpportunity({ note: "Withdrawn by the ministry." });

  await expect
    .poll(async () => (await mail.messagesTo(author)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});
