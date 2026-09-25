// criterion: @R-6.2 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";

// The given — a mail server that cannot be reached — is the catcher refusing every delivery
// (mail-delivery-fault.refuse_delivery), which the service meets exactly as it meets an
// unreachable server (spec/contract/observables.yaml, email.delivery_fault). The fault outlives
// the test unless lifted, so it is lifted in a finally, pass or fail.
//
// The action is an administrator publishing a Code With Us opportunity, which announces it to
// every account that has asked for new-opportunity notices (the seed holds 139). The
// opportunity is read as published off its own view, with no error on the form, and its history
// is read for any record of a failed delivery.
//
// "No further attempt": while the fault is in force the catcher keeps nothing, so absence alone
// shows nothing. Delivery is restored, something that does send is triggered — an invitation to
// join an organization — and once it has arrived, and a little longer, everything in the catcher
// must be that invitation: no announcement turns up late, sent again.
//
// A message that cannot be composed has no given the contract can set up; only the delivery half
// of the criterion's "cannot be composed or cannot be delivered" is exercised.

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const title = "R-6.2 opportunity published while mail cannot be delivered";
const invited = seed.users.vendorOne;

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

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

test("When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.", async ({
  surface,
  mail,
}) => {
  test.slow();
  await mail.clear();

  let opportunityId = "";
  try {
    await surface.mailDeliveryFault.open();
    await surface.mailDeliveryFault.refuseDelivery();
    const refused = (await readOrEmpty(() => surface.mailDeliveryFault.deliveryRefused())).trim();
    expect(refused, "the fault is in force").toBeTruthy();
    expect(refused, "the fault is in force").not.toMatch(/^(false|no|0|off)$/i);

    await surface.signIn(persona.administrator);
    await surface.opportunityCwuCreate.open();
    await surface.opportunityCwuCreate.publish({ ...complete, title });
    expect(await readOrEmpty(() => surface.opportunityCwuCreate.fieldError())).toBeFalsy();

    await expect.poll(() => readOrEmpty(() => surface.opportunityCwuEdit.opportunityIdentifier()), settle).toBeTruthy();
    opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  } finally {
    await surface.mailDeliveryFault.open();
    await surface.mailDeliveryFault.restoreDelivery();
  }

  // The opportunity is published, and nothing records for the publisher that delivery failed.
  await surface.opportunityCwuView.open({ opportunityId });
  expect((await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase()).toMatch(/publish/);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect((await readOrEmpty(() => surface.opportunityCwuEdit.historyTab())).toLowerCase()).not.toMatch(
    /deliver|undeliver|bounce|could not be sent|failed to send/,
  );
  await surface.signOut();

  // Delivery works again; the catcher is shown to be accepting by a message that does send.
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.addTeamMembers({ emails: [invited.email] });
  await expect.poll(async () => (await mail.messagesTo(invited.email)).length, settle).toBeGreaterThan(0);

  // Messages that follow a request reach the catcher within the same second; allow a margin
  // for anything the service might be sending again.
  await new Promise((resolve) => setTimeout(resolve, 5000));

  expect(await mail.messagesTo(serviceAddress), "an announcement sent again after delivery was restored").toEqual([]);
  const invitations = (await mail.messagesTo(invited.email)).length;
  await surface.caughtMessageList.open();
  expect(Number(await surface.caughtMessageList.messageCount()), "only the invitation is in the catcher").toBe(invitations);
});
