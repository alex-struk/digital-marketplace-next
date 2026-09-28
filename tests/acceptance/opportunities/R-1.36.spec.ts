// criterion: @R-1.36 v1
// provenance: blind, spec@f31700e000484947669c48e50cf9c73b4d1e20c7, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity with watchers and submitted proposals. The seed's
// published Code With Us opportunity is used; its author is the public sector employee the seed
// names. A vendor submits a proposal against it and a second vendor watches it, and the given is
// read back rather than assumed: the vendor reads a submitted proposal against this opportunity
// on their own dashboard, and the administrator reads more watchers than before on the
// opportunity's reporting. Watching is a toggle, so a toggle that lowered the count (the vendor
// was already watching) is toggled back.
//
// The catcher is emptied just before the cancellation, and shown to be empty, so whatever it
// holds afterwards follows from cancelling. The watcher and the proponent count as told only when
// a message caught since then both names them among its visible recipients or its blind copies
// (spec/contract/observables.yaml, email.notes) and names this opportunity's title in its subject
// or body, identified the same way as the author's notice. The author's notice is not detected by a count —
// the catcher's search answers at most fifty messages — but found by what it is about: a message
// visibly addressed to the author that names this opportunity's title. Being visibly addressed
// to the author is what makes it separate from the notice to the watchers and proponents.

const statement =
  "Cancelling an opportunity notifies everyone watching it and everyone who has submitted a proposal to it, and separately notifies its author.";

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const opportunity = seed.opportunities.publishedCodeWithUs;
const opportunityId = opportunity.id;
const watcher = seed.users.proponentTwo;
const proponent = seed.users.vendorOne;
const author = seed.users.staffOne;

type Mail = { messagesTo(address: string): Promise<Array<{ ID: string }>>; clear(): Promise<void> };

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

async function watcherCount(surface: Surface): Promise<number> {
  await surface.opportunityCwuEdit.open({ opportunityId });
  return count(await readOrEmpty(() => surface.opportunityCwuEdit.reportingWatchers()));
}

// The row of the signed-in vendor's own proposals that names this opportunity, or "".
async function ownProposalRow(surface: Surface): Promise<string> {
  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  const table = await readOrEmpty(() => surface.proposalVendorDashboard.myProposalsTable());
  const title = opportunity.title.toLowerCase();
  return (
    table
      .split("\n")
      .map((row) => row.toLowerCase())
      .find((row) => row.includes(title)) ?? ""
  );
}

async function toggleWatchAsWatcher(surface: Surface): Promise<void> {
  await surface.signIn(persona.competingVendor);
  await surface.opportunityCwuView.open({ opportunityId });
  await surface.opportunityCwuView.toggleWatch();
  await surface.signOut();
}

// Leaves the administrator signed in, on a published opportunity with a watcher and a proponent.
async function arrangeWatcherAndProponent(surface: Surface): Promise<void> {
  await surface.signIn(persona.vendor);
  try {
    await surface.proposalCwuCreate.open({ opportunityId });
    await surface.proposalCwuCreate.chooseProponentIndividual();
    await surface.proposalCwuCreate.acceptProgramTerms();
    await surface.proposalCwuCreate.acceptAppTerms();
    await surface.proposalCwuCreate.submitProposal({
      proposalText: "R-1.36 a proposal submitted against the seeded published opportunity.",
    });
  } catch {
    // Already holding a proposal against this opportunity; whether it is submitted is read below.
  }
  await expect.poll(() => ownProposalRow(surface), settle).toMatch(/submit/);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  const before = await watcherCount(surface);
  await surface.signOut();

  await toggleWatchAsWatcher(surface);

  await surface.signIn(persona.administrator);
  await expect.poll(() => watcherCount(surface), settle).not.toBe(before);
  const after = await watcherCount(surface);
  if (after < before) {
    await surface.signOut();
    await toggleWatchAsWatcher(surface);
    await surface.signIn(persona.administrator);
    await expect.poll(() => watcherCount(surface), settle).toBeGreaterThan(after);
  }

  await surface.opportunityCwuView.open({ opportunityId });
  expect((await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase()).toMatch(/publish/);
}

async function cancelWithCatcherEmptied(surface: Surface, mail: Mail): Promise<void> {
  await mail.clear();
  await surface.caughtMessageList.open();
  expect(count(await readOrEmpty(() => surface.caughtMessageList.messageCount())), "the catcher was emptied").toBe(0);

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.cancelOpportunity({ note: "Withdrawn by the ministry." });
}

test(`${statement} — everyone watching it and everyone who has submitted a proposal to it is notified`, async ({
  surface,
  mail,
}) => {
  test.slow();
  await arrangeWatcherAndProponent(surface);
  await cancelWithCatcherEmptied(surface, mail);

  const people = [watcher.email, proponent.email];
  const recipientsOf = new Map<string, string>();
  async function unreached(): Promise<string[]> {
    const candidates = [...(await mail.messagesTo(serviceAddress))];
    for (const address of people) candidates.push(...(await mail.messagesTo(address)));
    for (const { ID } of candidates) {
      if (recipientsOf.has(ID)) continue;
      await surface.caughtMessage.open({ messageId: ID });
      const about = [
        await readOrEmpty(() => surface.caughtMessage.subject()),
        await readOrEmpty(() => surface.caughtMessage.plainTextBody()),
        await readOrEmpty(() => surface.caughtMessage.htmlBody()),
      ]
        .join(" ")
        .toLowerCase();
      if (!about.includes(opportunity.title.toLowerCase())) {
        recipientsOf.set(ID, "");
        continue;
      }
      const visible = await readOrEmpty(() => surface.caughtMessage.visibleRecipients());
      const copied = await readOrEmpty(() => surface.caughtMessage.copiedRecipients());
      recipientsOf.set(ID, `${visible} ${copied}`.toLowerCase());
    }
    const everyone = [...recipientsOf.values()].join(" ");
    return people.filter((address) => !everyone.includes(address.toLowerCase()));
  }

  await expect.poll(unreached, settle).toEqual([]);
});

test(`${statement} — its author is notified separately`, async ({ surface, mail }) => {
  test.slow();
  await arrangeWatcherAndProponent(surface);
  await cancelWithCatcherEmptied(surface, mail);

  // A message visibly addressed to the author that is about this opportunity.
  async function noticeFound(): Promise<boolean> {
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
      if (about.includes(opportunity.title.toLowerCase())) return true;
    }
    return false;
  }

  await expect.poll(noticeFound, settle).toBe(true);
});
