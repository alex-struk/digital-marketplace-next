// criterion: @R-1.35 v1
// provenance: blind, spec@76d9da180ae1fba4b970cd40bf8a0a55a680eb3e, derived 2026-10-02
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity with watchers and submitted proposals. The seed's
// published Code With Us opportunity is used; its author is the public sector employee the seed
// names, and the target is put back to the seed before every test, so it starts watched by
// nobody and with no proposals. A vendor submits a proposal against it and a second vendor asks
// to watch it. That is the whole of the given: nothing else about either vendor is read.
//
// The when is an administrator editing it or adding an addendum. Those are two ways in, so each
// is its own test from the same given. The catcher is emptied just before the change, so what it
// holds afterwards follows from the change.
//
// The then is that the watcher, the proponent and the author are each notified once. A message to
// a group is addressed to the service's own sending address with everyone else as a blind copy
// (spec/contract/observables.yaml, email.notes), so a person counts as notified by a message
// when it names them among its visible recipients or its blind copies. The candidates are the
// messages visibly addressed to that person and those visibly addressed to the service's own
// address, each read one at a time through caught-message.

const statement =
  "Changing or adding an addendum to an opportunity that is neither a draft nor cancelled notifies everyone watching it, everyone who has submitted a proposal to it, and its author.";

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const opportunityId = seed.opportunities.publishedCodeWithUs.id;
const watcher = seed.users.proponentTwo;
const proponent = seed.users.vendorOne;
const author = seed.users.staffOne;
const people = [watcher.email, proponent.email, author.email].map((address) => address.toLowerCase());

type Mail = { messagesTo(address: string): Promise<Array<{ ID: string }>>; clear(): Promise<void> };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

// A published opportunity with a submitted proposal and a watcher; leaves nobody signed in.
async function arrangeGiven(surface: Surface): Promise<void> {
  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "R-1.35 a proposal submitted against the seeded published opportunity.",
  });
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await surface.opportunityWatchRequest.open({ program: "code-with-us" });
  await surface.opportunityWatchRequest.watchByRequest({ opportunityId });
  await surface.signOut();
}

// For each of the three people, how many distinct messages caught so far reached them.
async function timesReached(surface: Surface, mail: Mail): Promise<number[]> {
  const ids = new Set<string>();
  for (const address of [serviceAddress, ...people]) {
    for (const { ID } of await mail.messagesTo(address)) ids.add(ID);
  }
  const counts = people.map(() => 0);
  for (const ID of ids) {
    await surface.caughtMessage.open({ messageId: ID });
    const recipients = [
      await readOrEmpty(() => surface.caughtMessage.visibleRecipients()),
      await readOrEmpty(() => surface.caughtMessage.copiedRecipients()),
    ]
      .join(" ")
      .toLowerCase();
    people.forEach((address, i) => {
      if (recipients.includes(address)) counts[i] += 1;
    });
  }
  return counts;
}

async function expectEachNotifiedOnce(surface: Surface, mail: Mail): Promise<void> {
  await expect
    .poll(async () => (await timesReached(surface, mail)).every((n) => n >= 1), settle)
    .toBe(true);
  expect(await timesReached(surface, mail), "watcher, proponent, author").toEqual([1, 1, 1]);
}

test(`${statement} — an administrator edits it`, async ({ surface, mail }) => {
  test.slow();
  await arrangeGiven(surface);

  await surface.signIn(persona.administrator);
  await mail.clear();
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.editDetails({
    description: "R-1.35 the description as an administrator changed it after publication.",
  });

  await expectEachNotifiedOnce(surface, mail);
});

test(`${statement} — an administrator adds an addendum`, async ({ surface, mail }) => {
  test.slow();
  await arrangeGiven(surface);

  await surface.signIn(persona.administrator);
  await mail.clear();
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.addAddendum({ text: "R-1.35 an addendum an administrator added after publication." });

  await expectEachNotifiedOnce(surface, mail);
});
