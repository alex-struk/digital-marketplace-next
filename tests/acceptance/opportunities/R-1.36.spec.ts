// criterion: @R-1.36 v1
// provenance: blind, spec@76d9da180ae1fba4b970cd40bf8a0a55a680eb3e, derived 2026-10-02
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity with watchers and submitted proposals. The seed's
// published Code With Us opportunity is used; its author is the public sector employee the seed
// names, and the target is put back to the seed before every test, so it starts watched by
// nobody and with no proposals. A vendor submits a proposal against it and a second vendor asks
// to watch it. That is the whole of the given: nothing else about either vendor is read.
//
// The when is an administrator cancelling it, with the catcher emptied just before, so what it
// holds afterwards follows from the cancellation.
//
// The then has two parts, each its own test. The watcher and the proponent count as told when a
// message caught since then names them among its visible recipients or its blind copies (a
// message to a group is addressed to the service's own sending address with everyone else as a
// blind copy, spec/contract/observables.yaml, email.notes) and is about this opportunity, by its
// title, and about its cancellation. The author's notice is told separately: a message visibly
// addressed to the author that names this opportunity's title and its cancellation.

const statement =
  "Cancelling an opportunity notifies everyone watching it and everyone who has submitted a proposal to it, and separately notifies its author.";

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const opportunity = seed.opportunities.publishedCodeWithUs;
const opportunityId = opportunity.id;
const title = opportunity.title.toLowerCase();
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

// A published opportunity with a submitted proposal and a watcher, then cancelled by an
// administrator with the catcher emptied just before.
async function cancelWithWatcherAndProponent(surface: Surface, mail: Mail): Promise<void> {
  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "R-1.36 a proposal submitted against the seeded published opportunity.",
  });
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await surface.opportunityWatchRequest.open({ program: "code-with-us" });
  await surface.opportunityWatchRequest.watchByRequest({ opportunityId });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await mail.clear();
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.cancelOpportunity({ note: "Withdrawn by the ministry." });
}

type Read = { visible: string; copied: string; about: string };

async function readMessage(surface: Surface, ID: string): Promise<Read> {
  await surface.caughtMessage.open({ messageId: ID });
  return {
    visible: (await readOrEmpty(() => surface.caughtMessage.visibleRecipients())).toLowerCase(),
    copied: (await readOrEmpty(() => surface.caughtMessage.copiedRecipients())).toLowerCase(),
    about: [
      await readOrEmpty(() => surface.caughtMessage.subject()),
      await readOrEmpty(() => surface.caughtMessage.plainTextBody()),
      await readOrEmpty(() => surface.caughtMessage.htmlBody()),
    ]
      .join(" ")
      .toLowerCase(),
  };
}

test(`${statement} — everyone watching it and everyone who has submitted a proposal to it is told it has been cancelled`, async ({
  surface,
  mail,
}) => {
  test.slow();
  await cancelWithWatcherAndProponent(surface, mail);

  const people = [watcher.email, proponent.email].map((address) => address.toLowerCase());
  async function untold(): Promise<string[]> {
    const ids = new Set<string>();
    for (const address of [serviceAddress, ...people]) {
      for (const { ID } of await mail.messagesTo(address)) ids.add(ID);
    }
    let told = "";
    for (const ID of ids) {
      const message = await readMessage(surface, ID);
      if (message.about.includes(title) && message.about.includes("cancel")) {
        told += ` ${message.visible} ${message.copied}`;
      }
    }
    return people.filter((address) => !told.includes(address));
  }

  await expect.poll(untold, settle).toEqual([]);
});

test(`${statement} — its author is told separately that the cancellation was actioned`, async ({ surface, mail }) => {
  test.slow();
  await cancelWithWatcherAndProponent(surface, mail);

  const address = author.email.toLowerCase();
  async function noticeFound(): Promise<boolean> {
    for (const { ID } of await mail.messagesTo(author.email)) {
      const message = await readMessage(surface, ID);
      if (message.visible.includes(address) && message.about.includes(title) && message.about.includes("cancel")) {
        return true;
      }
    }
    return false;
  }

  await expect.poll(noticeFound, settle).toBe(true);
});
