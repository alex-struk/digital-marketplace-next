// criterion: @R-1.35 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity with watchers and submitted proposals. The seed's open
// Code With Us opportunity is published, and its author is the public sector employee the seed
// names. A vendor submits a proposal against it and a second vendor watches it; before anything
// is changed, the given is read back rather than assumed: the administrator reads more watchers
// than before on the opportunity's own reporting, and the vendor reads, on their own dashboard,
// a submitted proposal against this opportunity.
//
// A vendor holds at most one proposal per opportunity, and another spec may already have had the
// same vendor submit against this record, so the vendor's submission here may add nothing. What
// the given needs is that a submitted proposal from them is there, not that this run made it, so
// that is what is read — it holds whichever spec runs first.
//
// The seeded opportunity is loaded once and never reset, and watching is a toggle, so the
// watcher and the proponent are set up exactly once, in a single test. The administrator then
// changes the opportunity's details and, in turn, adds an addendum; the catcher is emptied
// before each, and after each the three people must be reached: the watcher, the proponent and
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

async function reportedWatchers(surface: Surface): Promise<string> {
  await surface.opportunityCwuEdit.open({ opportunityId });
  return readOrEmpty(() => surface.opportunityCwuEdit.reportingWatchers());
}

// The row of the signed-in vendor's own proposals that names this opportunity, or "".
async function ownProposalRow(surface: Surface): Promise<string> {
  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  const table = await readOrEmpty(() => surface.proposalVendorDashboard.myProposalsTable());
  const title = seed.opportunities.publishedCodeWithUs.title.toLowerCase();
  return (
    table
      .split("\n")
      .map((row) => row.toLowerCase())
      .find((row) => row.includes(title)) ?? ""
  );
}

async function arrangeWatcherAndProponent(surface: Surface): Promise<void> {
  await surface.signIn(persona.administrator);
  const before = await reportedWatchers(surface);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  try {
    await surface.proposalCwuCreate.open({ opportunityId });
    await surface.proposalCwuCreate.chooseProponentIndividual();
    await surface.proposalCwuCreate.acceptProgramTerms();
    await surface.proposalCwuCreate.acceptAppTerms();
    await surface.proposalCwuCreate.submitProposal({
      proposalText: "R-1.35 a proposal submitted against the seeded published opportunity.",
    });
  } catch {
    // Already holding a proposal against this opportunity; whether it is submitted is read below.
  }
  await expect.poll(() => ownProposalRow(surface), settle).toMatch(/submit/);
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await surface.opportunityCwuView.open({ opportunityId });
  await surface.opportunityCwuView.toggleWatch();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toMatch(/publish/);
  await expect.poll(async () => count(await reportedWatchers(surface)), settle).toBeGreaterThan(count(before));
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

test(statement, async ({ surface, mail }) => {
  await arrangeWatcherAndProponent(surface);

  await mail.clear();
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.editDetails({
    description: "R-1.35 the description as an administrator changed it after publication.",
  });
  await expectEachReached(surface, mail);

  await mail.clear();
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.addAddendum({ text: "R-1.35 an addendum an administrator added after publication." });
  await expectEachReached(surface, mail);
});
