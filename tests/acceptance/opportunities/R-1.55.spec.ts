// criterion: @R-1.55 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test starts from a draft of its own, made by the administrator, and establishes that it
// was stored — the screen it lands on carries an identifier — before its panel is opened. Where
// the target does not store the Team With Us draft at all, for a reason this criterion does not
// govern, that case is recorded as blocked.
//
// A panel is read by who it names. The names of the people who may appear on it are read off
// their own profiles first, by the administrator, so that the members and the chair the panel
// screen shows can be told apart by person. Each case then turns the draft's panel into exactly
// the faulty panel it names and establishes that before it is put forward:
//
//   - fewer than two members: every other member is removed and the one kept is made chair,
//     and the panel is read to name that one person and nobody else;
//   - the same person twice: one person is added twice, and the panel is read to name them
//     twice;
//   - no chair: the chair is taken off the panel, and the chair is read to name nobody. Where
//     no action on the panel screen can leave a panel with nobody named chair, the case is
//     recorded as blocked rather than a panel with a chair being put forward in its place;
//   - more than one chair: a second member is marked as chair; a chair that moves rather than
//     doubles is the second chair being refused;
//   - somebody who is not a public sector employee: a vendor is added, and the panel is read to
//     name them.
//
// "Rejected" is read by opening the panel afresh and requiring it to be as it was before the
// attempt. A faulty panel the screen will not let be composed at all — a vendor never offered
// as a choice, the last member the form will not remove — counts as refused, because the
// actions fail rather than wait. Where the faulty panel is composed and put forward, the
// observation naming its fault is waited for. The same person named twice must always have its
// reason named. More than one chair has no observation naming its reason, so that case rests on
// the panel never being saved with two chairs.

const statement =
  "A Sprint With Us or Team With Us opportunity must name an evaluation panel of at least two distinct public sector employees, exactly one of whom is the chair; a submission with fewer than two members, the same person twice, no chair, more than one chair, or anyone who is not a public sector employee is rejected and the reason is named.";

const settle = { timeout: 15000 };

type Panel = Surface["evaluationPanelSwu"];
type User = { id: string };

const creator = seed.users.administratorOne;
const publicSector: User[] = [
  seed.users.administratorOne,
  seed.users.administratorTwo,
  seed.users.staffOne,
  seed.users.staffTwo,
  seed.users.staffPanelEvaluator,
  seed.users.staffPanelChair,
];

interface Program {
  name: string;
  draft(surface: Surface, title: string): Promise<string>;
  panel(surface: Surface): Panel;
}

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function landedIdentifier(read: () => Promise<string>): Promise<string> {
  try {
    await expect.poll(() => readOrEmpty(read), settle).toBeTruthy();
    return await readOrEmpty(read);
  } catch {
    return "";
  }
}

const programs: Program[] = [
  {
    name: "Sprint With Us",
    async draft(surface, title) {
      await surface.opportunitySwuCreate.open();
      await surface.opportunitySwuCreate.saveDraft({ title });
      return landedIdentifier(() => surface.opportunitySwuEdit.opportunityIdentifier());
    },
    panel: (surface) => surface.evaluationPanelSwu,
  },
  {
    name: "Team With Us",
    async draft(surface, title) {
      await surface.opportunityTwuCreate.open();
      await surface.opportunityTwuCreate.addResource({ serviceArea: "Full Stack Developer", targetAllocation: 100 });
      await surface.opportunityTwuCreate.saveDraft({ title });
      return landedIdentifier(() => surface.opportunityTwuEdit.opportunityIdentifier());
    },
    panel: (surface) => surface.evaluationPanelTwu,
  },
];

// Reads each person's name off their own profile, as the administrator.
async function namesOf(surface: Surface, users: User[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  for (const user of users) {
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

async function draftPanel(surface: Surface, program: Program, title: string, extra: User[] = []) {
  await surface.signIn(persona.administrator);
  const names = await namesOf(surface, [...publicSector, ...extra]);
  expect(names.get(creator.id)).toBeTruthy();

  const opportunityId = await program.draft(surface, title);
  if (program.name === "Team With Us" && !opportunityId) {
    test.skip(true, "blocked: the target did not store the Team With Us draft, so there is no panel to put forward");
  }
  expect(opportunityId).toBeTruthy();

  const panel = program.panel(surface);
  await panel.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => panel.panelMemberRow()), settle).toBeTruthy();
  const before = await panel.panelMemberRow();
  return { opportunityId, panel, before, names };
}

// Runs steps that compose the faulty panel; true when one of them was refused.
async function refusedWhileComposing(steps: () => Promise<void>): Promise<boolean> {
  try {
    await steps();
    return false;
  } catch {
    return true;
  }
}

// Puts the panel forward; true when saving it was refused outright.
async function putForward(panel: Panel): Promise<boolean> {
  return refusedWhileComposing(() => panel.saveEvaluationPanel());
}

async function expectPanelUnchanged(panel: Panel, opportunityId: string, before: string): Promise<void> {
  await panel.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => panel.panelMemberRow()), settle).toBe(before);
}

for (const program of programs) {
  test(`${statement} (${program.name}: fewer than two members)`, async ({ surface }) => {
    const { opportunityId, panel, before, names } = await draftPanel(surface, program, `R-1.55 ${program.name} panel of one`);

    const refused = await refusedWhileComposing(async () => {
      for (const id of named(await panel.panelMemberRow(), names)) {
        if (id !== creator.id) await panel.removePanelMember({ member: publicSector.find((u) => u.id === id) });
      }
      if (!named(await panel.panelMemberRow(), names).includes(creator.id)) await panel.addPanelMember({ member: creator });
      if (!named(await readOrEmpty(() => panel.chairField()), names).includes(creator.id)) {
        await panel.markMemberAsChair({ member: creator });
      }
    });

    if (!refused) {
      const composed = await panel.panelMemberRow();
      expect(named(composed, names)).toEqual([creator.id]);
      expect(occurrences(composed, names.get(creator.id)!)).toBe(1);
      if (!(await putForward(panel))) {
        await expect.poll(() => readOrEmpty(() => panel.minimumMembersError()), settle).toBeTruthy();
      }
    }
    await expectPanelUnchanged(panel, opportunityId, before);
  });

  test(`${statement} (${program.name}: the same person twice)`, async ({ surface }) => {
    const { opportunityId, panel, before, names } = await draftPanel(surface, program, `R-1.55 ${program.name} panel naming one person twice`);
    const twice = seed.users.staffPanelEvaluator;

    await panel.addPanelMember({ member: twice });
    const secondRefused = await refusedWhileComposing(() => panel.addPanelMember({ member: twice }));
    if (!secondRefused) {
      expect(occurrences(await panel.panelMemberRow(), names.get(twice.id)!)).toBeGreaterThanOrEqual(2);
      await putForward(panel);
    }

    await expect.poll(() => readOrEmpty(() => panel.duplicateMemberError()), settle).toBeTruthy();
    await expectPanelUnchanged(panel, opportunityId, before);
  });

  test(`${statement} (${program.name}: no chair)`, async ({ surface }) => {
    const { opportunityId, panel, before, names } = await draftPanel(surface, program, `R-1.55 ${program.name} panel with no chair`);
    const first = seed.users.staffOne;
    const second = seed.users.staffPanelEvaluator;

    const refused = await refusedWhileComposing(async () => {
      const present = named(await panel.panelMemberRow(), names);
      if (!present.includes(first.id)) await panel.addPanelMember({ member: first });
      if (!present.includes(second.id)) await panel.addPanelMember({ member: second });
      for (const id of named(await panel.panelMemberRow(), names)) {
        if (id !== first.id && id !== second.id) await panel.removePanelMember({ member: publicSector.find((u) => u.id === id) });
      }
    });

    if (!refused) {
      if (named(await readOrEmpty(() => panel.chairField()), names).length > 0) {
        try {
          await panel.choosePanelChair({ member: null });
        } catch {
          // No choice of nobody is offered; read below.
        }
      }
      if (named(await readOrEmpty(() => panel.chairField()), names).length > 0) {
        test.skip(true, "blocked: no action on the panel screen leaves a panel with nobody named chair, so a panel without a chair cannot be put forward");
      }
      expect(named(await panel.panelMemberRow(), names).sort()).toEqual([first.id, second.id].sort());
      if (!(await putForward(panel))) {
        await expect.poll(() => readOrEmpty(() => panel.missingChairError()), settle).toBeTruthy();
      }
    }
    await expectPanelUnchanged(panel, opportunityId, before);
  });

  test(`${statement} (${program.name}: more than one chair)`, async ({ surface }) => {
    const { opportunityId, panel, names } = await draftPanel(surface, program, `R-1.55 ${program.name} panel with two chairs`);
    const other = seed.users.staffOne;

    // A panel of two with one chair, the starting point the second chair is added to.
    const present = named(await panel.panelMemberRow(), names);
    if (!present.includes(creator.id)) await panel.addPanelMember({ member: creator });
    if (!present.includes(other.id)) await panel.addPanelMember({ member: other });
    if (!named(await readOrEmpty(() => panel.chairField()), names).includes(creator.id)) {
      await panel.markMemberAsChair({ member: creator });
    }
    expect(named(await readOrEmpty(() => panel.chairField()), names)).toEqual([creator.id]);

    await refusedWhileComposing(async () => {
      await panel.markMemberAsChair({ member: other });
      await panel.saveEvaluationPanel();
    });

    await panel.open({ opportunityId });
    expect(named(await readOrEmpty(() => panel.chairField()), names).length).toBeLessThanOrEqual(1);
  });

  test(`${statement} (${program.name}: somebody who is not a public sector employee)`, async ({ surface }) => {
    const vendor = seed.users.vendorOne;
    const { opportunityId, panel, before, names } = await draftPanel(
      surface,
      program,
      `R-1.55 ${program.name} panel naming a vendor`,
      [vendor],
    );

    const refused = await refusedWhileComposing(() => panel.addPanelMember({ member: vendor }));
    if (!refused) {
      expect(named(await panel.panelMemberRow(), names)).toContain(vendor.id);
      if (!(await putForward(panel))) {
        await expect.poll(() => readOrEmpty(() => panel.nonPublicSectorMemberError()), settle).toBeTruthy();
      }
    }
    await expectPanelUnchanged(panel, opportunityId, before);
  });
}
