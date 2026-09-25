// criterion: @R-6.15 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion names two notices that must hide their recipients the way every other
// multi-recipient notice does, and each gets a test.
//
// The panel notice: an administrator publishes a Sprint With Us opportunity whose panel is
// users.staffOne and users.staffPanelEvaluator, then adds two more people at once —
// users.staffTwo and users.staffPanelChair — so that the notice to the newly added (R-5.17) goes
// to more than one person.
//
// The owner's notice: the seeded closed Team With Us opportunity is taken through individual
// evaluation and agreed scores (the same route R-5.31 takes), and the chair submits the
// consensus, which tells the opportunity's owner (users.staffOne) and every administrator.
//
// In each, the catcher is emptied just before the change, and every message caught afterwards is
// read whole through caught-message: those caught-message-list lists, and those the catcher's
// search finds visibly addressed to any of the people or to the service's own address. Every
// message that reached more than one person must show only the service's own address as its
// visible recipient and carry the people as blind copies; no message may show one of the people
// to another; and each person the notice is for must be reached.

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };

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

type Caught = { id: string; visible: string[]; copied: string[] };

async function everyMessage(surface: Surface, mail: Mail, people: string[]): Promise<Caught[]> {
  const ids = new Set<string>();
  await surface.caughtMessageList.open();
  for (const id of identifiersIn(await readOrEmpty(() => surface.caughtMessageList.messageIdentifiers()))) ids.add(id);
  for (const address of [...people, serviceAddress]) {
    for (const { ID } of await mail.messagesTo(address)) ids.add(ID);
  }
  const caught: Caught[] = [];
  for (const id of ids) {
    try {
      await surface.caughtMessage.open({ messageId: id });
    } catch {
      continue;
    }
    caught.push({
      id,
      visible: addressesIn(await readOrEmpty(() => surface.caughtMessage.visibleRecipients())),
      copied: addressesIn(await readOrEmpty(() => surface.caughtMessage.copiedRecipients())),
    });
  }
  return caught;
}

async function expectHidden(surface: Surface, mail: Mail, people: string[], mustReach: string[]): Promise<void> {
  const lower = people.map((address) => address.toLowerCase());
  await expect
    .poll(async () => {
      const reached = new Set((await everyMessage(surface, mail, people)).flatMap((m) => [...m.visible, ...m.copied]));
      return mustReach.filter((address) => !reached.has(address.toLowerCase()));
    }, { ...settle, message: "people the notice did not reach" })
    .toEqual([]);

  const caught = await everyMessage(surface, mail, people);
  const multiRecipient = caught.filter((m) => new Set([...m.visible, ...m.copied].filter((a) => a !== serviceAddress)).size > 1);
  expect(multiRecipient.length, "a notice that reached more than one of the people").toBeGreaterThan(0);

  for (const message of multiRecipient) {
    expect.soft(message.visible, `visible recipients of ${message.id}`).toEqual([serviceAddress]);
    expect.soft(message.copied.filter((a) => lower.includes(a)).length, `people carried as blind copies on ${message.id}`).toBeGreaterThan(1);
  }
  for (const message of caught) {
    expect.soft(message.visible.filter((a) => lower.includes(a)).length, `people shown to one another on ${message.id}`).toBeLessThanOrEqual(
      message.copied.length === 0 ? 1 : 0,
    );
  }
}

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const swuDetails = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
  mandatorySkills: ["Frontend Development"],
  totalMaxBudget: 500000,
  questionsWeight: 25,
  codeChallengeWeight: 25,
  teamScenarioWeight: 25,
  priceWeight: 25,
};

test("A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice (the notice sent to an evaluation panel)", async ({
  surface,
  mail,
}) => {
  test.slow();
  const onPanel = [seed.users.staffOne, seed.users.staffPanelEvaluator];
  const added = [seed.users.staffTwo, seed.users.staffPanelChair];

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 500000,
    capabilities: ["Frontend Development"],
  });
  await surface.opportunitySwuCreate.addTeamQuestion({
    question: "Describe how your team has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel({ members: onPanel, chair: onPanel[1] });
  await surface.opportunitySwuCreate.publish({ ...swuDetails, title: "R-6.15 published opportunity whose panel gains two people" });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.evaluationPanelSwu.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => surface.evaluationPanelSwu.panelMemberRow()), settle).toBeTruthy();

  await mail.clear();
  for (const member of added) await surface.evaluationPanelSwu.addPanelMember({ member });
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  const people = [...onPanel, ...added].map((user) => user.email);
  await expectHidden(surface, mail, people, added.map((user) => user.email));
});

test("A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice (the notice sent to an opportunity's owner)", async ({
  surface,
  mail,
}) => {
  test.slow();
  const opportunityId = seed.opportunities.closedTeamWithUs.id;
  const proposals = [seed.proposals.teamWithUsOne.id, seed.proposals.teamWithUsTwo.id, seed.proposals.teamWithUsThree.id];
  const questions = [0, 1, 2, 3];

  const scoreEveryProponent = async () => {
    for (const proposalId of proposals) {
      await surface.evaluationIndividualCreateTwu.open({ opportunityId, proposalId });
      for (const order of questions) {
        await surface.evaluationIndividualCreateTwu.enterQuestionScore({ order, score: 4 });
        await surface.evaluationIndividualCreateTwu.enterQuestionNotes({ order, notes: "A complete reading of this answer." });
      }
      await surface.evaluationIndividualCreateTwu.saveDraft();
    }
    await surface.evaluationIndividualListTwu.open({ opportunityId });
    await surface.evaluationIndividualListTwu.submitScoresForConsensus();
  };

  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent();
  for (const proposalId of proposals) {
    await surface.evaluationConsensusCreateTwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationConsensusCreateTwu.enterQuestionScore({ order, score: 4 });
      await surface.evaluationConsensusCreateTwu.enterQuestionNotes({ order, notes: "The panel agreed on this score for this answer." });
    }
    await surface.evaluationConsensusCreateTwu.saveDraft();
  }

  await mail.clear();
  await surface.evaluationConsensusListTwu.open({ opportunityId });
  await surface.evaluationConsensusListTwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListTwu.confirmSubmitConsensus();

  const owner = seed.users.staffOne.email;
  const administrators = [seed.users.administratorOne.email, seed.users.administratorTwo.email];
  await expectHidden(surface, mail, [owner, ...administrators], [owner, ...administrators]);
});
