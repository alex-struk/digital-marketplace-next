// criterion: @R-5.17 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test builds its own Sprint With Us opportunity as the administrator, and establishes
// that its panel names exactly two people — users.staffOne and users.staffPanelEvaluator —
// before the third person, users.staffTwo, is added. Who a panel names is read by person: the
// three names are read off their own profiles first, so the panel screen's rows can be told
// apart. The creator may be put on a new panel of their own accord, so any member other than
// the two is taken off, and the panel read again, before anything is counted.
//
// The catcher is emptied just before the third person is added, so every message found
// afterwards belongs to that change. A message is addressed to one person and every other
// recipient is a blind copy (spec/contract/observables.yaml, email.notes), so a person is
// counted as reached when any caught message names them among its visible recipients or its
// blind copies. Every message is read one at a time through caught-message: the ones
// caught-message-list lists, and the ones the catcher's search finds visibly addressed to any
// of the three people or to the service's own address.
//
// Emptying the catcher is itself a request to it, so a test that goes on to assert an absence
// has already shown the catcher was reachable, as observables.yaml asks.

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 15000 };
const first = seed.users.staffOne;
const second = seed.users.staffPanelEvaluator;
const added = seed.users.staffTwo;
const creator = seed.users.administratorOne;
const people = [first, second, added, creator];

type Mail = { messagesTo(address: string): Promise<Array<{ ID: string }>> };

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

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function namesOf(surface: Surface): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  for (const user of people) {
    await surface.userProfile.open({ userId: user.id });
    const name = (await readOrEmpty(() => surface.userProfile.nameField())).trim();
    if (name) names.set(user.id, name);
  }
  return names;
}

function named(text: string, names: Map<string, string>): string[] {
  return [...names.entries()].filter(([, name]) => text.includes(name)).map(([id]) => id);
}

async function landedIdentifier(surface: Surface): Promise<string> {
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  return surface.opportunitySwuEdit.opportunityIdentifier();
}

// Leaves the panel naming exactly the first two people, the second as chair, and reads it back.
async function panelOfTwo(surface: Surface, opportunityId: string, names: Map<string, string>): Promise<void> {
  const panel = surface.evaluationPanelSwu;
  await panel.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => panel.panelMemberRow()), settle).toBeTruthy();
  const present = named(await panel.panelMemberRow(), names);
  if (!present.includes(first.id)) await panel.addPanelMember({ member: first });
  if (!present.includes(second.id)) await panel.addPanelMember({ member: second });
  if (!named(await readOrEmpty(() => panel.chairField()), names).includes(second.id)) {
    await panel.markMemberAsChair({ member: second });
  }
  const others = named(await panel.panelMemberRow(), names).filter((id) => id !== first.id && id !== second.id);
  for (const id of others) {
    await panel.removePanelMember({ member: people.find((u) => u.id === id) });
  }
  if (others.length > 0 || !present.includes(first.id) || !present.includes(second.id)) {
    await panel.saveEvaluationPanel();
  }
  await panel.open({ opportunityId });
  await expect
    .poll(async () => named(await readOrEmpty(() => panel.panelMemberRow()), names).sort(), settle)
    .toEqual([first.id, second.id].sort());
}

async function addThirdPerson(surface: Surface, opportunityId: string, names: Map<string, string>): Promise<void> {
  const panel = surface.evaluationPanelSwu;
  await panel.open({ opportunityId });
  await panel.addPanelMember({ member: added });
  await panel.saveEvaluationPanel();
  await panel.open({ opportunityId });
  await expect
    .poll(async () => named(await readOrEmpty(() => panel.panelMemberRow()), names).sort(), settle)
    .toEqual([first.id, second.id, added.id].sort());
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

// Every recipient, visible or blind, of every message caught since the catcher was emptied.
async function everyoneReached(surface: Surface, mail: Mail): Promise<string> {
  const ids = new Set<string>();
  await surface.caughtMessageList.open();
  for (const id of identifiersIn(await readOrEmpty(() => surface.caughtMessageList.messageIdentifiers()))) ids.add(id);
  for (const address of [...people.map((u) => u.email), serviceAddress]) {
    for (const { ID } of await mail.messagesTo(address)) ids.add(ID);
  }
  let recipients = "";
  for (const messageId of ids) {
    try {
      await surface.caughtMessage.open({ messageId });
    } catch {
      continue;
    }
    recipients += ` ${await readOrEmpty(() => surface.caughtMessage.visibleRecipients())}`;
    recipients += ` ${await readOrEmpty(() => surface.caughtMessage.copiedRecipients())}`;
  }
  return recipients.toLowerCase();
}

test("When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft (a third person added to a published opportunity's panel is notified, and the two already on it are not)", async ({
  surface,
  mail,
}) => {
  await surface.signIn(persona.administrator);
  const names = await namesOf(surface);
  for (const user of people) expect(names.get(user.id)).toBeTruthy();

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
  await surface.opportunitySwuCreate.setEvaluationPanel({ members: [first, second], chair: second });
  await surface.opportunitySwuCreate.publish({
    ...details,
    title: "R-5.17 published opportunity whose panel gains a third person",
  });
  const opportunityId = await landedIdentifier(surface);
  await surface.opportunitySwuView.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuView.status()), settle).toBeTruthy();
  expect((await surface.opportunitySwuView.status()).toLowerCase()).not.toMatch(/draft/);

  await panelOfTwo(surface, opportunityId, names);

  await mail.clear();
  await addThirdPerson(surface, opportunityId, names);

  await expect.poll(() => everyoneReached(surface, mail), settle).toContain(added.email.toLowerCase());

  const reached = await everyoneReached(surface, mail);
  expect(reached).not.toContain(first.email.toLowerCase());
  expect(reached).not.toContain(second.email.toLowerCase());
});

test("When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft (the same change made while the opportunity is still a draft notifies nobody)", async ({
  surface,
  mail,
}) => {
  await surface.signIn(persona.administrator);
  const names = await namesOf(surface);
  for (const user of people) expect(names.get(user.id)).toBeTruthy();

  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title: "R-5.17 draft opportunity whose panel gains a third person" });
  const opportunityId = await landedIdentifier(surface);

  await panelOfTwo(surface, opportunityId, names);

  await mail.clear();
  await addThirdPerson(surface, opportunityId, names);

  // Messages that follow a request reach the catcher within the same second; allow a margin.
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const reached = await everyoneReached(surface, mail);
  expect(reached).not.toContain(added.email.toLowerCase());
  expect(reached).not.toContain(first.email.toLowerCase());
  expect(reached).not.toContain(second.email.toLowerCase());
});
