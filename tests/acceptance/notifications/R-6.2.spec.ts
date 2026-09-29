// criterion: @R-6.2 v1
// provenance: blind, spec@258c8b6542d73fd923b7fbc7b8c8d9d82627255b, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given — a mail server that cannot be reached — is the catcher refusing every delivery
// (mail-delivery-fault.refuse_delivery), which the service meets exactly as it meets an
// unreachable server (spec/contract/observables.yaml, email.delivery_fault). The fault outlives
// the test unless lifted, so it is lifted in a finally, pass or fail.
//
// The action is an administrator publishing a Code With Us opportunity, which announces it to
// every account that has asked for new-opportunity notices. The opportunity is read as
// published off its own view, with no error on the form, and its history is read for any record
// of a failed delivery.
//
// Every check on the catcher counts only messages about the opportunity this test publishes,
// told by its title. A message from earlier activity may still land after the catcher is
// cleared and before the refusal takes effect, and the criterion says nothing about it.
//
// "No further attempt": the catcher keeps nothing of a refused message, so a notice about the
// opportunity that turns up after delivery is restored was sent again — but only if every
// notice had already been tried and refused before the restore. A notice still waiting for its
// first attempt when delivery comes back would arrive once, as its first and only delivery, and
// that is not a repeat. So the fault is held long after the publish has been answered — far
// longer than the service takes to be refused on each of its fresh connections — and no notice
// about the opportunity may have reached the catcher by then. Only then is delivery restored.
// The catcher is shown to be accepting again by an invitation to join an organization, which
// does send, and after a further margin no message about the published opportunity may be in
// the catcher.
//
// A message that cannot be composed has no given the contract can set up; that clause is
// recorded in tests/acceptance/not-testable.yaml.

const settle = { timeout: 30000 };
// How long the fault is held after the publish is answered, so that every announcement batch
// has had its attempt refused before delivery is restored.
const refusedAttemptsSettle = 20000;
// How long, after the invitation has arrived, anything the service sends again is waited for.
const resendMargin = 10000;

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

function identifiersIn(listing: string): string[] {
  try {
    const parsed = JSON.parse(listing);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Not JSON; read as a plain list below.
  }
  return listing
    .split(/[\s,;[\]"']+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

// The subjects of every message in the catcher that is about the published opportunity.
async function noticesAboutOpportunity(surface: Surface): Promise<string[]> {
  await surface.caughtMessageList.open();
  const ids = identifiersIn(await readOrEmpty(() => surface.caughtMessageList.messageIdentifiers()));
  const subjects: string[] = [];
  for (const id of ids) {
    await surface.caughtMessage.open({ messageId: id });
    const subject = await readOrEmpty(() => surface.caughtMessage.subject());
    const text = [
      subject,
      await readOrEmpty(() => surface.caughtMessage.plainTextBody()),
      await readOrEmpty(() => surface.caughtMessage.htmlBody()),
    ].join(" ");
    if (text.includes(title)) subjects.push(subject);
  }
  return subjects;
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

    // Every announcement is tried, and refused, while the fault is still in force; none of them
    // reaches anybody.
    await new Promise((resolve) => setTimeout(resolve, refusedAttemptsSettle));
    await surface.mailDeliveryFault.open();
    expect((await readOrEmpty(() => surface.mailDeliveryFault.deliveryRefused())).trim(), "the fault is still in force").not.toMatch(
      /^(false|no|0|off)?$/i,
    );
    expect(
      await noticesAboutOpportunity(surface),
      "a notice about the published opportunity reached somebody while delivery was refused",
    ).toEqual([]);
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
  await new Promise((resolve) => setTimeout(resolve, resendMargin));

  // Every announcement had been refused before delivery came back, so one arriving now was sent
  // again.
  expect(
    await noticesAboutOpportunity(surface),
    "a notice about the published opportunity, already refused, was sent again after delivery was restored",
  ).toEqual([]);
});
