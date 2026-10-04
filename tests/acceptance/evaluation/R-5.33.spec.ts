// criterion: @R-5.33 v1
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-04
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seeded closed Team With Us opportunity is taken into consensus, and its consensus
// scores are recorded and submitted by the chair (users.administratorOne,
// evaluation_panels.teamWithUs). Every agreed score is five out of five, which clears the
// minimum the seeded fourth question carries, so finalising is accepted. The opportunity's
// owner is users.staffOne, who created it.
//
// The catcher is emptied, and read back as empty and still empty a moment later, after the
// consensus is submitted and immediately before it is finalised, so that what is caught
// afterwards follows the finalising and not the submission.
//
// A notice may name its readers on any line, and a notice to several people carries them as
// blind copies behind the service's own address, so no search by visible recipient is used to
// find it. Every caught message is found through caught-message-list (and through the
// catcher's search on the service's own address), opened by its identifier, and a person
// counts as told when their address is among that message's visible recipients or its blind
// copies.

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };

type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string }>>;
};

const opportunityId = seed.opportunities.closedTeamWithUs.id;
const proposals = [
  seed.proposals.teamWithUsOne.id,
  seed.proposals.teamWithUsTwo.id,
  seed.proposals.teamWithUsThree.id,
];
const questions = [0, 1, 2, 3];

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

async function caughtCount(surface: Surface): Promise<number> {
  await surface.caughtMessageList.open();
  const count = Number.parseInt((await readOrEmpty(() => surface.caughtMessageList.messageCount())).trim(), 10);
  return Number.isNaN(count) ? -1 : count;
}

async function emptyCatcher(surface: Surface, mail: Mail): Promise<void> {
  let last = -1;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await mail.clear();
    await expect.poll(() => caughtCount(surface), settle).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    last = await caughtCount(surface);
    if (last === 0) return;
  }
  throw new Error(`the catcher could not be read back as empty before the consensus was finalised; last count ${last}`);
}

// Every address any caught message reached, visibly or as a blind copy.
async function everyoneReached(surface: Surface, mail: Mail): Promise<Set<string>> {
  const ids = new Set<string>();
  await surface.caughtMessageList.open();
  for (const id of identifiersIn(await readOrEmpty(() => surface.caughtMessageList.messageIdentifiers()))) ids.add(id);
  for (const { ID } of await mail.messagesTo(serviceAddress)) ids.add(ID);
  const reached = new Set<string>();
  for (const messageId of ids) {
    try {
      await surface.caughtMessage.open({ messageId });
    } catch {
      continue;
    }
    for (const address of addressesIn(await readOrEmpty(() => surface.caughtMessage.copiedRecipients()))) reached.add(address);
    for (const address of addressesIn(await readOrEmpty(() => surface.caughtMessage.visibleRecipients()))) reached.add(address);
  }
  return reached;
}

async function scoreEveryProponent(surface: Surface): Promise<void> {
  for (const proposalId of proposals) {
    await surface.evaluationIndividualCreateTwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationIndividualCreateTwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateTwu.saveDraft();
  }
  await surface.evaluationIndividualListTwu.open({ opportunityId });
  await surface.evaluationIndividualListTwu.submitScoresForConsensus();
}

test("When the consensus scores are finalised, the chair and the opportunity's owner are told.", async ({
  surface,
  mail,
}) => {
  test.slow();
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface);

  for (const proposalId of proposals) {
    await surface.evaluationConsensusCreateTwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationConsensusCreateTwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationConsensusCreateTwu.enterQuestionNotes({
        order,
        notes: "The panel agreed on this score for this answer.",
      });
    }
    await surface.evaluationConsensusCreateTwu.saveDraft();
  }

  await surface.evaluationConsensusListTwu.open({ opportunityId });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();

  await emptyCatcher(surface, mail);

  await surface.evaluationConsensusListTwu.open({ opportunityId });
  await surface.evaluationConsensusListTwu.finalizeConsensusScores();
  await surface.evaluationConsensusListTwu.confirmFinalizeConsensus();

  const chairAndOwner = [seed.users.administratorOne.email, seed.users.staffOne.email].map((address) =>
    address.toLowerCase(),
  );
  await expect
    .poll(async () => {
      const reached = await everyoneReached(surface, mail);
      return chairAndOwner.filter((address) => !reached.has(address));
    }, { ...settle, message: "the chair or owner not told of the finalised consensus" })
    .toEqual([]);
});
