// criterion: @R-1.37 v1
// provenance: blind, spec@f31700e000484947669c48e50cf9c73b4d1e20c7, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a complete draft opportunity; its author, the public sector employee the seed
// names, submits it for review. The administrators are every seeded account of the
// administrator type that has not been deactivated and has an address.
//
// The catcher is emptied just before the submission, and shown to be empty, so whatever it holds
// afterwards follows from submitting. The author's confirmation is not detected by a count — the
// catcher's search answers at most fifty messages — but found by what it is about: a message
// visibly addressed to the author that names this opportunity's title.
//
// An administrator counts as notified when any message caught since the submission names them
// among its visible recipients or its blind copies (spec/contract/observables.yaml, email.notes),
// each message read one at a time through caught-message.

const statement =
  "Submitting an opportunity for review notifies every administrator, and confirms the submission to its author.";

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const author = seed.users.staffOne;

type Mail = { messagesTo(address: string): Promise<Array<{ ID: string }>>; clear(): Promise<void> };
type SeededUser = { account_type?: string; status?: string; email?: string | null };

const administrators = (Object.values(seed.users) as SeededUser[])
  .filter((user) => user.account_type === "ADMIN" && !user.status && user.email)
  .map((user) => user.email as string);

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

async function emptyCatcher(surface: Surface, mail: Mail): Promise<void> {
  await mail.clear();
  await surface.caughtMessageList.open();
  expect(count(await readOrEmpty(() => surface.caughtMessageList.messageCount())), "the catcher was emptied").toBe(0);
}

async function submitAsAuthor(surface: Surface, mail: Mail, title: string): Promise<void> {
  await surface.signIn(persona.publicSectorStaff);
  await emptyCatcher(surface, mail);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({ ...complete, title });
}

test(`${statement} — every administrator is notified`, async ({ surface, mail }) => {
  const title = "R-1.37 opportunity submitted so that administrators are told";
  expect(administrators.length).toBeGreaterThan(0);

  await submitAsAuthor(surface, mail, title);

  const recipientsOf = new Map<string, string>();
  async function unreached(): Promise<string[]> {
    const candidates = [...(await mail.messagesTo(serviceAddress))];
    for (const address of administrators) candidates.push(...(await mail.messagesTo(address)));
    for (const { ID } of candidates) {
      if (recipientsOf.has(ID)) continue;
      await surface.caughtMessage.open({ messageId: ID });
      const visible = await readOrEmpty(() => surface.caughtMessage.visibleRecipients());
      const copied = await readOrEmpty(() => surface.caughtMessage.copiedRecipients());
      recipientsOf.set(ID, `${visible} ${copied}`.toLowerCase());
    }
    const everyone = [...recipientsOf.values()].join(" ");
    return administrators.filter((address) => !everyone.includes(address.toLowerCase()));
  }

  await expect.poll(unreached, settle).toEqual([]);
});

test(`${statement} — the author receives a confirmation`, async ({ surface, mail }) => {
  const title = "R-1.37 opportunity submitted so that its author is confirmed";

  await submitAsAuthor(surface, mail, title);

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
