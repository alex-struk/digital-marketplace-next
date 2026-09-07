// criterion: @R-1.34 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The opportunity is drafted by a member of public sector staff and published by an
// administrator, so the author who is to be confirmed is somebody other than the person
// who published it, and the confirmation can be told from an administrator's own mail.
//
// The first half of the criterion — everyone who asked for new-opportunity notices being
// told — is not asserted. That announcement goes to a group as blind copies, and the mail
// fixture searches by visible recipient only (mail.messagesTo), so a notice that did
// reach a subscriber would not be found and its absence would prove nothing.

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

test("publishing an opportunity confirms the publication to the opportunity's author", async ({
  surface,
  mail,
}) => {
  const title = "R-1.34 opportunity whose author is told it was published";
  const author = seed.users.staffOne.email;

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  await surface.signOut();

  const before = (await mail.messagesTo(author)).length;

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.publish();

  await expect
    .poll(async () => (await mail.messagesTo(author)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});
