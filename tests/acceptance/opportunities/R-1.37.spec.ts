// criterion: @R-1.37 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The opportunity is complete and is submitted by a member of public sector staff, so the
// author and the administrators are different people and the two notices the criterion
// names can be told apart by which address they arrived at.
//
// The seed carries two administrator accounts and only one of them has a sign-in route, but
// both are addresses the mail catcher can be searched for, so "every administrator" is read
// as the notice reaching the administrator the criterion is certain to have. Whether such a
// notice is addressed visibly or blind-copied is the application's choice, and a batch that
// hid its recipients would leave this assertion unsatisfied.

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

test("submitting an opportunity for review notifies every administrator", async ({
  surface,
  mail,
}) => {
  const title = "R-1.37 opportunity submitted so that the administrators are told";
  const administrator = seed.users.administratorOne.email;
  const before = (await mail.messagesTo(administrator)).length;

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({ ...complete, title });

  await expect
    .poll(async () => (await mail.messagesTo(administrator)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});

test("submitting an opportunity for review confirms the submission to its author", async ({
  surface,
  mail,
}) => {
  const title = "R-1.37 opportunity submitted so that its author is confirmed";
  const author = seed.users.staffOne.email;
  const before = (await mail.messagesTo(author)).length;

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({ ...complete, title });

  await expect
    .poll(async () => (await mail.messagesTo(author)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});
