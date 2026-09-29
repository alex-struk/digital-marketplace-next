// criterion: @R-6.2 v1
// provenance: blind, spec@0518dccea59a1ad5bce1f3b3ed4a00d0c8c61c73, derived 2026-09-29
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
// "No further attempt": the catcher keeps nothing of a refused message, so a notice about the
// opportunity that turns up after delivery is restored was sent again — but only if every
// notice had already been tried and refused before the restore. A notice still waiting for its
// first attempt when delivery comes back would arrive once, as its first and only delivery, and
// that is not a repeat. So the fault is held long after the publish has been answered — far
// longer than the service takes to be refused on each of its fresh connections — and nothing
// may have reached the catcher by then. Only then is delivery restored. The catcher is shown to
// be accepting again by an invitation to join an organization, which does send, and after a
// further margin no message about the published opportunity may be in the catcher, and no
// message may have reached any one person twice.
//
// A message that cannot be composed has no given the contract can set up; that clause is
// recorded in tests/acceptance/not-testable.yaml.

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

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

function addressesIn(text: string): string[] {
  return [...new Set(text.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/g) ?? [])];
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

async function caughtCount(surface: Surface): Promise<number> {
  await surface.caughtMessageList.open();
  return Number((await readOrEmpty(() => surface.caughtMessageList.messageCount())).trim() || "0");
}

type Caught = { id: string; subject: string; recipients: string[]; aboutOpportunity: boolean };

// Every message in the catcher, read whole.
async function caughtMessages(surface: Surface): Promise<Caught[]> {
  await surface.caughtMessageList.open();
  const ids = identifiersIn(await readOrEmpty(() => surface.caughtMessageList.messageIdentifiers()));
  const caught: Caught[] = [];
  for (const id of ids) {
    await surface.caughtMessage.open({ messageId: id });
    const subject = await readOrEmpty(() => surface.caughtMessage.subject());
    const visible = addressesIn(await readOrEmpty(() => surface.caughtMessage.visibleRecipients()));
    const copied = addressesIn(await readOrEmpty(() => surface.caughtMessage.copiedRecipients()));
    const text = [
      subject,
      await readOrEmpty(() => surface.caughtMessage.plainTextBody()),
      await readOrEmpty(() => surface.caughtMessage.htmlBody()),
    ].join(" ");
    caught.push({
      id,
      subject,
      recipients: [...new Set([...visible, ...copied])].filter((address) => address !== serviceAddress),
      aboutOpportunity: text.includes(title) || visible.includes(serviceAddress),
    });
  }
  return caught;
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
    expect(await caughtCount(surface), "a notice reached somebody while delivery was refused").toBe(0);
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

  const caught = await caughtMessages(surface);

  // Every announcement had been refused before delivery came back, so one arriving now was sent
  // again.
  const resent = caught.filter((message) => message.aboutOpportunity);
  expect(
    resent.map((message) => message.subject),
    "a notice about the published opportunity, already refused, was sent again after delivery was restored",
  ).toEqual([]);

  // Nor does anybody receive any one message more than once.
  const seen = new Map<string, number>();
  for (const message of caught) {
    for (const address of message.recipients) {
      const key = `${message.subject}\u0000${address}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
  }
  const repeated = [...seen.entries()].filter(([, count]) => count > 1).map(([key]) => key.replace("\u0000", " → "));
  expect(repeated, "a message reached the same person more than once").toEqual([]);
});
