// criterion: @R-6.17 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// "No notification of any kind" is checked against a notice that reaches one person at their
// own visible address — an invitation to join an organization — with an active person invited
// straight afterwards, so that the active person's message proves the catcher is reachable and
// the absence for the deactivated account is evidence of what the service decided.
//
// The notice about a watched opportunity, which the criterion names, is not asserted: it goes
// out as a batch of blind copies, and the mail fixture searches only by visible recipient, so
// neither its arrival nor its absence for one account can be read.
//
// Each test reactivates the account it deactivated, so it is left as it was found.

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

test("a deactivated account receives no notification of any kind", async ({ surface, mail }) => {
  const deactivated = seed.users.vendorWithTermsReset;
  const active = seed.users.proponentThree;

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: deactivated.id });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();

  // Deactivation itself may tell the person. Let that message land before counting, so that
  // what is counted afterwards is only what follows the deactivation.
  await expect
    .poll(async () => (await mail.messagesTo(deactivated.email)).length, { timeout: 5000 })
    .toBeGreaterThan(0)
    .catch(() => undefined);
  const deactivatedBefore = (await mail.messagesTo(deactivated.email)).length;
  const activeBefore = (await mail.messagesTo(active.email)).length;
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.withPendingInvitation.id });
  await surface.organizationEdit.addTeamMembers({ emails: [deactivated.email] });
  await surface.organizationEdit.addTeamMembers({ emails: [active.email] });

  await expect
    .poll(async () => (await mail.messagesTo(active.email)).length, { timeout: 10000 })
    .toBeGreaterThan(activeBefore);
  expect((await mail.messagesTo(deactivated.email)).length).toBe(deactivatedBefore);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: deactivated.id });
  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();
});

test("the watch itself is retained so that reactivating the account restores it", async ({ surface }) => {
  const watcher = seed.users.invitedVendor;
  const title = "R-6.17 published opportunity watched by an account that is later deactivated";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.opportunityCwuEdit.open({ opportunityId });
  const unwatched = await surface.opportunityCwuEdit.reportingWatchers();
  await surface.signOut();

  await surface.signIn(persona.invitedVendor);
  await surface.opportunityCwuView.open({ opportunityId });
  await surface.opportunityCwuView.toggleWatch();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  const watched = await surface.opportunityCwuEdit.reportingWatchers();
  expect(watched).not.toBe(unwatched);

  await surface.userProfile.open({ userId: watcher.id });
  await surface.userProfile.deactivateAccount();
  await surface.userProfile.confirmActivationChange();
  await surface.userProfile.open({ userId: watcher.id });
  await surface.userProfile.reactivateAccount();
  await surface.userProfile.confirmActivationChange();

  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.reportingWatchers()).toBe(watched);
});
