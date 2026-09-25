// criterion: @R-5.1 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test starts from a Sprint With Us draft of its own, made by the public sector employee
// persona (users.staffOne), whose panel is then set. Only Sprint With Us is exercised: the two
// panel screens carry the same actions and observations, and the criterion's note says the
// minimum of two is the same in both programs.
//
// A panel is read by who it names. The names of the people who may appear on it are read off
// their own profiles first, by the administrator, so that the members and the chair the panel
// screen shows can be told apart by person. A new draft's panel may already hold more than its
// creator, so nothing is assumed about it: each case turns the draft's panel into exactly the
// faulty panel it names and reads it back before putting it forward.
//
//   - a panel of one person: every member but the creator is removed, the creator is made
//     chair, and the panel is read to name the creator once and nobody else;
//   - the same person named twice: one person is added twice and read to appear twice;
//   - two chairs: from a panel of two with one chair, the other member is marked as chair. A
//     chair that moves rather than doubles is the second chair being refused, so what is read
//     is that the panel never names more than one chair;
//   - a vendor: a vendor is added and read to be named on the panel.
//
// "The opportunity keeps the panel it had" is read by opening the panel afresh and requiring it
// to read as it did before the attempt. A faulty panel the screen will not let be composed at
// all counts as refused, because the actions fail rather than wait; where it is composed and put
// forward, the observation naming the broken rule is waited for. The same person named twice
// must always have its rule named.

const statement =
  "An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair.";

const settle = { timeout: 15000 };

type Panel = Surface["evaluationPanelSwu"];
type User = { id: string };

const creator = seed.users.staffOne;
const people: User[] = [
  seed.users.administratorOne,
  seed.users.administratorTwo,
  seed.users.staffOne,
  seed.users.staffTwo,
  seed.users.staffPanelEvaluator,
  seed.users.staffPanelChair,
  seed.users.vendorOne,
];

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

function occurrences(text: string, name: string): number {
  return name ? text.split(name).length - 1 : 0;
}

function named(text: string, names: Map<string, string>): string[] {
  return [...names.entries()].filter(([, name]) => occurrences(text, name) > 0).map(([id]) => id);
}

function person(id: string): User {
  return people.find((u) => u.id === id) ?? { id };
}

async function draftPanel(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  const names = await namesOf(surface);
  expect(names.get(creator.id)).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  const panel = surface.evaluationPanelSwu;
  await panel.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => panel.panelMemberRow()), settle).toBeTruthy();
  const before = await panel.panelMemberRow();
  return { opportunityId, panel, before, names };
}

// Runs steps that compose or put forward the faulty panel; true when one of them was refused.
async function refused(steps: () => Promise<void>): Promise<boolean> {
  try {
    await steps();
    return false;
  } catch {
    return true;
  }
}

async function expectPanelUnchanged(panel: Panel, opportunityId: string, before: string): Promise<void> {
  await panel.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => panel.panelMemberRow()), settle).toBe(before);
}

test(`${statement} (a panel of one person is rejected with the rule named, and the opportunity keeps the panel it had)`, async ({
  surface,
}) => {
  const { opportunityId, panel, before, names } = await draftPanel(surface, "R-5.1 opportunity offered a panel of one person");

  const refusedComposing = await refused(async () => {
    const present = named(await panel.panelMemberRow(), names);
    if (!present.includes(creator.id)) await panel.addPanelMember({ member: creator });
    if (!named(await readOrEmpty(() => panel.chairField()), names).includes(creator.id)) {
      await panel.markMemberAsChair({ member: creator });
    }
    for (const id of named(await panel.panelMemberRow(), names)) {
      if (id !== creator.id) await panel.removePanelMember({ member: person(id) });
    }
  });

  if (!refusedComposing) {
    const composed = await panel.panelMemberRow();
    expect(named(composed, names)).toEqual([creator.id]);
    expect(occurrences(composed, names.get(creator.id)!)).toBe(1);
    if (!(await refused(() => panel.saveEvaluationPanel()))) {
      await expect.poll(() => readOrEmpty(() => panel.minimumMembersError()), settle).toBeTruthy();
    }
  }
  await expectPanelUnchanged(panel, opportunityId, before);
});

test(`${statement} (a panel naming the same person twice is rejected with the rule named, and the opportunity keeps the panel it had)`, async ({
  surface,
}) => {
  const { opportunityId, panel, before, names } = await draftPanel(surface, "R-5.1 opportunity offered one person twice");
  const twice = seed.users.staffPanelEvaluator;

  await panel.addPanelMember({ member: twice });
  const secondRefused = await refused(() => panel.addPanelMember({ member: twice }));
  if (!secondRefused) {
    expect(occurrences(await panel.panelMemberRow(), names.get(twice.id)!)).toBeGreaterThanOrEqual(2);
    await refused(() => panel.saveEvaluationPanel());
  }

  await expect.poll(() => readOrEmpty(() => panel.duplicateMemberError()), settle).toBeTruthy();
  await expectPanelUnchanged(panel, opportunityId, before);
});

test(`${statement} (a panel naming two chairs is rejected)`, async ({ surface }) => {
  const { opportunityId, panel, names } = await draftPanel(surface, "R-5.1 opportunity offered two chairs");
  const other = seed.users.staffPanelEvaluator;

  // A panel of two with one chair: the starting point the second chair is added to.
  const present = named(await panel.panelMemberRow(), names);
  if (!present.includes(creator.id)) await panel.addPanelMember({ member: creator });
  if (!present.includes(other.id)) await panel.addPanelMember({ member: other });
  if (!named(await readOrEmpty(() => panel.chairField()), names).includes(creator.id)) {
    await panel.markMemberAsChair({ member: creator });
  }
  expect(named(await readOrEmpty(() => panel.chairField()), names)).toEqual([creator.id]);

  await refused(async () => {
    await panel.markMemberAsChair({ member: other });
    await panel.saveEvaluationPanel();
  });

  await panel.open({ opportunityId });
  expect(named(await readOrEmpty(() => panel.chairField()), names).length).toBeLessThanOrEqual(1);
});

test(`${statement} (a panel naming a vendor is rejected with the rule named, and the opportunity keeps the panel it had)`, async ({
  surface,
}) => {
  const { opportunityId, panel, before, names } = await draftPanel(surface, "R-5.1 opportunity offered a vendor on its panel");
  const vendor = seed.users.vendorOne;

  const refusedComposing = await refused(() => panel.addPanelMember({ member: vendor }));
  if (!refusedComposing) {
    expect(named(await panel.panelMemberRow(), names)).toContain(vendor.id);
    if (!(await refused(() => panel.saveEvaluationPanel()))) {
      await expect.poll(() => readOrEmpty(() => panel.nonPublicSectorMemberError()), settle).toBeTruthy();
    }
  }
  await expectPanelUnchanged(panel, opportunityId, before);
});
