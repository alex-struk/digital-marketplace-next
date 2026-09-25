// criterion: @R-6.8 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given's one hundred and twenty people are seed.subscribers: 120 accounts that have asked
// for new-opportunity notices, addressed by the seed's own pattern. With the other seeded
// accounts that have asked, 139 are due the announcement — three batches of at most fifty
// either way, as the seed manifest says.
//
// The catcher is emptied, an administrator publishes a Code With Us opportunity, and every
// message visibly addressed to the service's own address is read whole through caught-message
// until the blind copies between them cover all 120. The messages that carry any of them are the
// batches: there must be three, none carrying more than fifty blind copies, each showing only the
// service's own address as its visible recipient, so that no recipient's address is shown to
// any other.

// email.configured_sender_address and email.batch_size in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";
const batchSize = 50;

const settle = { timeout: 60000, intervals: [1000, 2000, 5000] };
const subscribers = Array.from({ length: seed.subscribers.group.count }, (_, i) =>
  seed.subscribers.group.email_pattern.replace("NNN", String(i + 1).padStart(3, "0")).toLowerCase(),
);

type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string }>>;
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

type Batch = { id: string; visible: string[]; copied: string[] };

// Every message addressed visibly to the service's own address that carries any subscriber.
async function batches(surface: Surface, mail: Mail): Promise<Batch[]> {
  const found: Batch[] = [];
  for (const { ID } of await mail.messagesTo(serviceAddress)) {
    await surface.caughtMessage.open({ messageId: ID });
    const visible = addressesIn(await readOrEmpty(() => surface.caughtMessage.visibleRecipients()));
    const copied = addressesIn(await readOrEmpty(() => surface.caughtMessage.copiedRecipients()));
    if ([...visible, ...copied].some((address) => subscribers.includes(address))) found.push({ id: ID, visible, copied });
  }
  return found;
}

test("A notice that goes to many people at once is split into batches of at most fifty and addressed so that no recipient can see who else received it.", async ({
  surface,
  mail,
}) => {
  test.slow();
  await mail.clear();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title: "R-6.8 opportunity announced to more than a hundred people" });

  await expect
    .poll(async () => {
      const reached = new Set((await batches(surface, mail)).flatMap((batch) => batch.copied));
      return subscribers.filter((address) => !reached.has(address)).length;
    }, { ...settle, message: "subscribers the announcement did not reach as blind copies" })
    .toBe(0);

  const sent = await batches(surface, mail);
  expect(sent.length, "messages the announcement was split into").toBe(3);
  for (const batch of sent) {
    expect.soft(batch.copied.length, `blind copies on ${batch.id}`).toBeLessThanOrEqual(batchSize);
    expect.soft(batch.visible, `visible recipients of ${batch.id}`).toEqual([serviceAddress]);
    expect.soft(batch.visible.filter((address) => subscribers.includes(address)), `subscribers shown on ${batch.id}`).toEqual([]);
  }
});
