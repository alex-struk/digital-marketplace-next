// criterion: @R-1.34 v1
// provenance: blind, spec@f31700e000484947669c48e50cf9c73b4d1e20c7, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The opportunity is drafted by the public sector employee the seed names and published by an
// administrator, so its author is somebody other than the person who publishes it. The people
// who have asked for new-opportunity notices are the seed's subscriber group
// (seed.subscribers.group: count, address pattern, first and last).
//
// The catcher is emptied just before the publication, and shown to be empty, so whatever it
// holds afterwards follows from publishing. The author's confirmation is not detected by a
// count — the catcher's search answers at most fifty messages — but found by what it is about:
// a message visibly addressed to the author that names this opportunity's title. Being visibly
// addressed to the author is also what makes it separate from the announcement, which goes to
// the service's own sending address with everyone else as a blind copy
// (spec/contract/observables.yaml, email.notes).
//
// A subscriber counts as told when any message caught since the publication names them among
// its visible recipients or its blind copies, each message read one at a time through
// caught-message.

const statement =
  "Publishing an opportunity notifies everyone who has asked for new-opportunity notifications, and separately confirms the publication to the opportunity's author.";

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const author = seed.users.staffOne;

type Mail = { messagesTo(address: string): Promise<Array<{ ID: string }>>; clear(): Promise<void> };

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

function count(reading: string): number {
  const found = reading.match(/\d+/);
  return found ? Number(found[0]) : 0;
}

// Every address that has asked for new-opportunity notices, from the seed's subscriber group.
function subscriberAddresses(): string[] {
  const { count: size, email_pattern: pattern } = seed.subscribers.group;
  const addresses = Array.from({ length: size }, (_, i) => pattern.replace("NNN", String(i + 1).padStart(3, "0")));
  expect(addresses[0]).toBe(seed.subscribers.first.email);
  expect(addresses[size - 1]).toBe(seed.subscribers.last.email);
  return addresses;
}

async function draftByAuthor(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  await expect.poll(() => readOrEmpty(() => surface.opportunityCwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

async function emptyCatcher(surface: Surface, mail: Mail): Promise<void> {
  await mail.clear();
  await surface.caughtMessageList.open();
  expect(count(await readOrEmpty(() => surface.caughtMessageList.messageCount())), "the catcher was emptied").toBe(0);
}

async function publishAsAdministrator(surface: Surface, opportunityId: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.publish();
}

test(`${statement} — everyone who has asked for new-opportunity notifications is notified`, async ({
  surface,
  mail,
}) => {
  test.slow();
  const title = "R-1.34 opportunity whose publication is announced to subscribers";
  const subscribers = subscriberAddresses();
  const opportunityId = await draftByAuthor(surface, title);

  await emptyCatcher(surface, mail);
  await publishAsAdministrator(surface, opportunityId);

  // Recipients, visible and blind, of each caught message, read once per message.
  const recipientsOf = new Map<string, string>();
  async function unreached(): Promise<string[]> {
    const candidates = [...(await mail.messagesTo(serviceAddress))];
    for (const address of subscribers) candidates.push(...(await mail.messagesTo(address)));
    for (const { ID } of candidates) {
      if (recipientsOf.has(ID)) continue;
      await surface.caughtMessage.open({ messageId: ID });
      const visible = await readOrEmpty(() => surface.caughtMessage.visibleRecipients());
      const copied = await readOrEmpty(() => surface.caughtMessage.copiedRecipients());
      recipientsOf.set(ID, `${visible} ${copied}`.toLowerCase());
    }
    const everyone = [...recipientsOf.values()].join(" ");
    return subscribers.filter((address) => !everyone.includes(address.toLowerCase()));
  }

  await expect.poll(unreached, { timeout: 60000 }).toEqual([]);
});

test(`${statement} — the opportunity's author receives a separate confirmation`, async ({ surface, mail }) => {
  const title = "R-1.34 opportunity whose author is told it was published";
  const opportunityId = await draftByAuthor(surface, title);

  await emptyCatcher(surface, mail);
  await publishAsAdministrator(surface, opportunityId);

  // A message visibly addressed to the author that is about this opportunity.
  async function confirmationFound(): Promise<boolean> {
    for (const { ID } of await mail.messagesTo(author.email)) {
      await surface.caughtMessage.open({ messageId: ID });
      const visible = (await readOrEmpty(() => surface.caughtMessage.visibleRecipients())).toLowerCase();
      if (!visible.includes(author.email.toLowerCase())) continue;
      const about = [
        await readOrEmpty(() => surface.caughtMessage.subject()),
        await readOrEmpty(() => surface.caughtMessage.plainTextBody()),
        await readOrEmpty(() => surface.caughtMessage.htmlBody()),
      ]
        .join(" ")
        .toLowerCase();
      if (about.includes(title.toLowerCase())) return true;
    }
    return false;
  }

  await expect.poll(confirmationFound, settle).toBe(true);
});
