// criterion: @R-5.17 v1
// provenance: blind, spec@f31700e000484947669c48e50cf9c73b4d1e20c7, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test builds its own Sprint With Us opportunity as the administrator, under a title no
// other record carries, and establishes that its panel names exactly two people —
// users.staffOne and users.staffPanelEvaluator — before the third, users.staffTwo, is added.
// Who a panel names is read by person: the names are read off each person's profile first, so
// the panel screen's rows can be told apart. The creator may be put on a new panel of their own
// accord, so any member other than the two is taken off and the panel read again.
//
// Other activity on the service reaches the same people in the same window — the announcement
// of the opportunity's own publication among it — so nothing is counted until the catcher has
// been emptied and has been read back as empty, and stays empty for a moment, immediately
// before the third person is added. Reading it back empty also shows the catcher is reachable
// before any absence is asserted (observables.yaml, email.notes).
//
// A message counts only when it is about this opportunity — its subject or body carries the
// opportunity's title — and it counts for a person when it names them among its visible
// recipients or its blind copies, since every recipient but one is a blind copy. The same
// count is made for the person added and for the two already on the panel.

const settle = { timeout: 15000 };
const first = seed.users.staffOne;
const second = seed.users.staffPanelEvaluator;
const added = seed.users.staffTwo;
const creator = seed.users.administratorOne;
const people = [first, second, added, creator];

type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string }>>;
};

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

async function caughtCount(surface: Surface): Promise<number> {
  await surface.caughtMessageList.open();
  const count = Number.parseInt((await readOrEmpty(() => surface.caughtMessageList.messageCount())).trim(), 10);
  return Number.isNaN(count) ? -1 : count;
}

// Empties the catcher and reads it back as empty twice, two seconds apart, so that nothing
// already on its way from earlier activity lands after the count begins. Tries a few times.
async function emptyCatcher(surface: Surface, mail: Mail): Promise<void> {
  let last = -1;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await mail.clear();
    await expect.poll(() => caughtCount(surface), settle).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    last = await caughtCount(surface);
    if (last === 0) return;
  }
  throw new Error(`the catcher could not be read back as empty before the third person was added; last count ${last}`);
}

// For each person, how many caught messages about the opportunity with this title reach them.
async function aboutOpportunityFor(surface: Surface, mail: Mail, title: string): Promise<Record<string, number>> {
  const ids = new Set<string>();
  await surface.caughtMessageList.open();
  for (const id of identifiersIn(await readOrEmpty(() => surface.caughtMessageList.messageIdentifiers()))) ids.add(id);
  for (const user of [first, second, added]) {
    for (const { ID } of await mail.messagesTo(user.email)) ids.add(ID);
  }
  const counts: Record<string, number> = { [first.id]: 0, [second.id]: 0, [added.id]: 0 };
  for (const messageId of ids) {
    try {
      await surface.caughtMessage.open({ messageId });
    } catch {
      continue;
    }
    const content = [
      await readOrEmpty(() => surface.caughtMessage.subject()),
      await readOrEmpty(() => surface.caughtMessage.plainTextBody()),
      await readOrEmpty(() => surface.caughtMessage.htmlBody()),
    ].join("\n");
    if (!content.includes(title)) continue;
    const recipients = [
      await readOrEmpty(() => surface.caughtMessage.visibleRecipients()),
      await readOrEmpty(() => surface.caughtMessage.copiedRecipients()),
    ]
      .join(" ")
      .toLowerCase();
    for (const user of [first, second, added]) {
      if (recipients.includes(user.email.toLowerCase())) counts[user.id] += 1;
    }
  }
  return counts;
}

test("When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft (a third person added to a published opportunity's panel is notified, and the two already on it are not)", async ({
  surface,
  mail,
}) => {
  const title = `R-5.17 published opportunity ${Date.now()} whose panel gains a third person`;
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
  await surface.opportunitySwuCreate.publish({ ...details, title });
  const opportunityId = await landedIdentifier(surface);
  await surface.opportunitySwuView.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuView.status()), settle).toBeTruthy();
  expect((await surface.opportunitySwuView.status()).toLowerCase()).not.toMatch(/draft/);

  await panelOfTwo(surface, opportunityId, names);

  await emptyCatcher(surface, mail);
  await addThirdPerson(surface, opportunityId, names);

  await expect.poll(async () => (await aboutOpportunityFor(surface, mail, title))[added.id], settle).toBeGreaterThan(0);

  const counts = await aboutOpportunityFor(surface, mail, title);
  expect(counts[first.id]).toBe(0);
  expect(counts[second.id]).toBe(0);
});

test("When people are added to an evaluation panel, only the people newly added are notified, and only once the opportunity has left draft (the same change made while the opportunity is still a draft notifies nobody)", async ({
  surface,
  mail,
}) => {
  const title = `R-5.17 draft opportunity ${Date.now()} whose panel gains a third person`;
  await surface.signIn(persona.administrator);
  const names = await namesOf(surface);
  for (const user of people) expect(names.get(user.id)).toBeTruthy();

  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  const opportunityId = await landedIdentifier(surface);

  await panelOfTwo(surface, opportunityId, names);

  await emptyCatcher(surface, mail);
  await addThirdPerson(surface, opportunityId, names);

  // Messages that follow a request reach the catcher within the same second; allow a margin.
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const counts = await aboutOpportunityFor(surface, mail, title);
  expect(counts[added.id]).toBe(0);
  expect(counts[first.id]).toBe(0);
  expect(counts[second.id]).toBe(0);
});
