// criterion: @R-1.35 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity with watchers and submitted proposals. The seed's open
// Code With Us opportunity is published, and its author is the public sector employee the seed
// names. A vendor submits a proposal against it and a second vendor watches it; before anything
// is changed, the administrator reads both on the opportunity's own reporting — more proposals
// and more watchers than before — so the given is established rather than assumed.
//
// The catcher is then emptied, and the administrator either changes the opportunity's details
// or adds an addendum. Each of the three people must be reached: the watcher, the proponent and
// the author.
//
// An announcement to a group is addressed to the service's own sending address with everyone
// else as a blind copy (spec/contract/observables.yaml, email.notes), so a person is counted as
// reached when any message caught since the change names them among its visible recipients or
// its blind copies. The candidates are the messages visibly addressed to that person and those
// visibly addressed to the service's own address, each read one at a time through
// caught-message.

const statement =
  "Changing or adding an addendum to an opportunity that is neither a draft nor cancelled notifies everyone watching it, everyone who has submitted a proposal to it, and its author.";

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const opportunityId = seed.opportunities.publishedCodeWithUs.id;
const watcher = seed.users.proponentTwo;
const proponent = seed.users.vendorOne;
const author = seed.users.staffOne;

type Mail = { messagesTo(address: string): Promise<Array<{ ID: string }>> };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function reporting(surface: Surface): Promise<{ watchers: string; proposals: string }> {
  await surface.opportunityCwuEdit.open({ opportunityId });
  return {
    watchers: await readOrEmpty(() => surface.opportunityCwuEdit.reportingWatchers()),
    proposals: await readOrEmpty(() => surface.opportunityCwuEdit.reportingProposals()),
  };
}

async function arrangeWatcherAndProponent(surface: Surface): Promise<void> {
  await surface.signIn(persona.administrator);
  const before = await reporting(surface);
  await surface.signOut();

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
  await surface.opportunityCwuView.open({ opportunityId });
  await surface.opportunityCwuView.toggleWatch();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toMatch(/publish/);
  await expect.poll(async () => count((await reporting(surface)).watchers), settle).toBeGreaterThan(count(before.watchers));
  await expect.poll(async () => count((await reporting(surface)).proposals), settle).toBeGreaterThan(count(before.proposals));
}

function count(reading: string): number {
  const found = reading.match(/\d+/);
  return found ? Number(found[0]) : 0;
}

// Every recipient, visible or blind, of the messages that could have reached the address.
async function everyoneReached(surface: Surface, mail: Mail, address: string): Promise<string> {
  const candidates = [...(await mail.messagesTo(address)), ...(await mail.messagesTo(serviceAddress))];
  const seen = new Set<string>();
  let recipients = "";
  for (const { ID } of candidates) {
    if (seen.has(ID)) continue;
    seen.add(ID);
    await surface.caughtMessage.open({ messageId: ID });
    recipients += ` ${await readOrEmpty(() => surface.caughtMessage.visibleRecipients())}`;
    recipients += ` ${await readOrEmpty(() => surface.caughtMessage.copiedRecipients())}`;
  }
  return recipients.toLowerCase();
}

async function expectEachReached(surface: Surface, mail: Mail): Promise<void> {
  for (const person of [watcher, proponent, author]) {
    await expect
      .poll(() => everyoneReached(surface, mail, person.email), settle)
      .toContain(person.email.toLowerCase());
  }
}

test(`${statement} (a change to its details)`, async ({ surface, mail }) => {
  await arrangeWatcherAndProponent(surface);
  await mail.clear();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.editDetails({
    description: "R-1.35 the description as an administrator changed it after publication.",
  });

  await expectEachReached(surface, mail);
});

test(`${statement} (an addendum added)`, async ({ surface, mail }) => {
  await arrangeWatcherAndProponent(surface);
  await mail.clear();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.addAddendum({ text: "R-1.35 an addendum an administrator added after publication." });

  await expectEachReached(surface, mail);
});
