// criterion: @R-6.4 v2
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// "The same for every kind of message" is sampled by three messages of different kinds, each
// triggered by a different part of the service: an invitation to join an organization, the
// announcement of a newly published opportunity, and the announcement of changed terms. The
// catcher is emptied first, and one message of each distinct subject is read whole through
// caught-message by the catcher's own identifier.
//
// The sender is held to the configured one the contract names (email.configured_sender): its
// display name, and exactly one address, the do-not-reply one. A reply-to is allowed to be
// absent or to name that same address, and nothing else. That a reply "reaches nobody" is a
// fact about the do-not-reply mailbox, which nothing here can observe; the test holds the reply
// address to the do-not-reply one.

// email.configured_sender and email.configured_sender_address in spec/contract/observables.yaml.
const configuredSenderName = "Digital Marketplace";
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const reader = seed.users.vendorOne;

type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string; Subject: string }>>;
};

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

async function onePerKind(mail: Mail): Promise<Map<string, string>> {
  const bySubject = new Map<string, string>();
  const found = [...(await mail.messagesTo(reader.email)), ...(await mail.messagesTo(serviceAddress))];
  for (const message of found) if (!bySubject.has(message.Subject)) bySubject.set(message.Subject, message.ID);
  return bySubject;
}

async function sendThreeKinds(surface: Surface, mail: Mail): Promise<Map<string, string>> {
  await mail.clear();

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.addTeamMembers({ emails: [reader.email] });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: "R-6.4 opportunity whose announcement is checked for its sender" });

  await surface.notificationTermsBroadcast.open();
  await surface.notificationTermsBroadcast.notifyVendorsOfUpdatedTerms();
  await surface.notificationTermsBroadcast.confirmNotifyVendors();

  await expect.poll(async () => (await onePerKind(mail)).size, settle).toBeGreaterThanOrEqual(3);
  return onePerKind(mail);
}

test("Every message the service sends comes from a single configured sender — a display name followed by one do-not-reply address, the same for every kind of message — and carries no reply-to address distinct from that sender.", async ({
  surface,
  mail,
}) => {
  test.slow();
  const messages = await sendThreeKinds(surface, mail);

  const senders = new Set<string>();
  for (const [listedSubject, messageId] of messages) {
    await surface.caughtMessage.open({ messageId });
    const sender = await readOrEmpty(() => surface.caughtMessage.sender());
    const replyTo = await readOrEmpty(() => surface.caughtMessage.replyTo());

    expect.soft(sender, `sender of "${listedSubject}" bears the service's name`).toContain(configuredSenderName);
    expect.soft(addressesIn(sender), `sender of "${listedSubject}" is the one do-not-reply address`).toEqual([serviceAddress]);
    expect
      .soft(
        addressesIn(replyTo).filter((address) => address !== serviceAddress),
        `reply-to of "${listedSubject}" names nothing but the sender`,
      )
      .toEqual([]);
    senders.add(sender.replace(/\s+/g, " ").trim());
  }

  expect(senders.size, `one sender across every kind of message: ${[...senders].join(" | ")}`).toBe(1);
});
