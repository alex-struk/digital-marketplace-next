// criterion: @R-2.36 v1
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-04
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// One test per act the criterion names. In each, the catcher is emptied immediately before the
// act, so what turns up afterwards can only have been sent by it.
//
// The criterion says who each notice reaches and nothing about how it is addressed, so a person
// counts as reached by any caught message naming them as a visible or a blind-copied recipient.
// The candidates are every message in the catcher's listing, every message found by the
// person's own address and every message found by the service's own address; each is opened and
// kept only where the person is among its recipients.
//
// Submitting: an administrator publishes a Code With Us opportunity, users.vendorOne submits a
// proposal to it, and a message must reach that vendor.
//
// Awarding: the seed's Code With Us opportunity already in processing
// (opportunities.cwuInProcessing) holds two evaluated proposals, from users.organizationOwner
// (proposals.cwuProcessingOne) and users.proponentTwo (proposals.cwuProcessingTwo). The
// administrator awards the first. The winner must be reached by a notice that reaches none of
// the others, and every other proponent must be reached.
//
// Withdrawing: the vendor withdraws the proposal it submitted, and the vendor and every
// administrator must each be reached by a message.

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };

const administrators = [seed.users.administratorOne.email, seed.users.administratorTwo.email];

type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string }>>;
};

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
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

function addressesIn(text: string): string[] {
  return [...new Set(text.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/g) ?? [])];
}

type Caught = { id: string; visible: string[]; copied: string[] };

async function readMessage(surface: Surface, messageId: string): Promise<Caught> {
  await surface.caughtMessage.open({ messageId });
  return {
    id: messageId,
    visible: addressesIn(await readOrEmpty(() => surface.caughtMessage.visibleRecipients())),
    copied: addressesIn(await readOrEmpty(() => surface.caughtMessage.copiedRecipients())),
  };
}

// Every caught message that reached this address, visibly or as a blind copy.
async function messagesReaching(surface: Surface, mail: Mail, address: string): Promise<Caught[]> {
  const ids = new Set<string>();
  await surface.caughtMessageList.open();
  for (const id of identifiersIn(await readOrEmpty(() => surface.caughtMessageList.messageIdentifiers()))) ids.add(id);
  for (const { ID } of await mail.messagesTo(address)) ids.add(ID);
  for (const { ID } of await mail.messagesTo(serviceAddress)) ids.add(ID);
  const wanted = address.toLowerCase();
  const reaching: Caught[] = [];
  for (const id of ids) {
    const message = await readMessage(surface, id);
    if (message.visible.includes(wanted) || message.copied.includes(wanted)) reaching.push(message);
  }
  return reaching;
}

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const details = {
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
  completionDate: inDays(35),
};

async function publishOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  await expect.poll(() => readOrEmpty(() => surface.opportunityCwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

async function startProposal(surface: Surface, opportunityId: string): Promise<void> {
  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
}

test("Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator. (submitting)", async ({
  surface,
  mail,
}) => {
  const opportunityId = await publishOpportunity(surface, "R-2.36 opportunity whose submission is confirmed by email");
  await startProposal(surface, opportunityId);

  await mail.clear();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal whose submission the vendor is written to about.",
  });

  await expect
    .poll(async () => (await messagesReaching(surface, mail, seed.users.vendorOne.email)).length, {
      ...settle,
      message: "the confirmation reached the submitting vendor",
    })
    .toBeGreaterThan(0);
});

test("Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator. (awarding)", async ({
  surface,
  mail,
}) => {
  test.slow();
  const opportunityId = seed.opportunities.cwuInProcessing.id;
  const winner = seed.users.organizationOwner.email.toLowerCase();
  const others = [seed.users.proponentTwo.email.toLowerCase()];

  await surface.signIn(persona.administrator);
  await surface.proposalCwuView.open({ opportunityId, proposalId: seed.proposals.cwuProcessingOne.id });

  await mail.clear();
  await surface.proposalCwuView.awardProposal();

  // Wait until every proponent has been reached by something, then judge the award notice.
  await expect
    .poll(async () => {
      const unreached: string[] = [];
      for (const address of [winner, ...others]) {
        if ((await messagesReaching(surface, mail, address)).length === 0) unreached.push(address);
      }
      return unreached;
    }, { ...settle, message: "proponents no notice of the award reached" })
    .toEqual([]);

  const toWinner = await messagesReaching(surface, mail, winner);
  const awardNotice = toWinner.find((message) =>
    others.every((address) => !message.visible.includes(address) && !message.copied.includes(address)),
  );
  expect(awardNotice, "an award notice that reached the winner and none of the others").toBeTruthy();
});

test("Submitting a proposal, awarding one and withdrawing one each send notifications: a confirmation to the submitting vendor, an award notice to the winner and a decision notice to everyone else, and a withdrawal notice to the vendor and to every administrator. (withdrawing)", async ({
  surface,
  mail,
}) => {
  test.slow();
  const opportunityId = await publishOpportunity(surface, "R-2.36 opportunity whose withdrawal is written about");
  await startProposal(surface, opportunityId);
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal the vendor later takes back.",
  });

  await mail.clear();
  await surface.proposalCwuEdit.withdrawProposal();

  // The vendor and every administrator must each be reached, as a visible or a blind-copied
  // recipient of whatever message carries the notice.
  await expect
    .poll(async () => {
      const unreached: string[] = [];
      for (const address of [seed.users.vendorOne.email, ...administrators]) {
        if ((await messagesReaching(surface, mail, address)).length === 0) unreached.push(address);
      }
      return unreached;
    }, { ...settle, message: "the vendor and administrators no withdrawal notice reached" })
    .toEqual([]);
});
