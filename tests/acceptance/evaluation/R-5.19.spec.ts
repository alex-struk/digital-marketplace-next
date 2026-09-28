// criterion: @R-5.19 v1
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The opportunity is a Sprint With Us draft the administrator makes, so it is not public.
// That the panel member did not create it is established from who created it: the test
// creates it signed in as the administrator, and the seeded administrator account is not
// either of the public sector accounts put on the panel. Nothing here reads the creator's
// name off any screen, since the criterion never promises it is shown to a panel member.
//
// Who the panel member persona signs in as depends on the target — users.staffOne on the
// oracle, users.staffPanelEvaluator elsewhere — so the first two tests put both on the
// panel. That the member opened this opportunity, rather than being shown some page, is
// read as the screen naming the opportunity's own identifier and showing at least one of
// its details exactly as its creator is shown them.
//
// The third test is the contrast the criterion draws. Its panel leaves users.staffOne off,
// so the public sector employee persona is somebody who neither created the draft nor sits
// on its panel, on every target. "Cannot see it at all" is read from the places such a
// person could find it — both dashboard lists, the opportunity list, and the opportunity's
// own screen, which must show them none of what its creator is shown.

const settle = { timeout: 15000 };

const panelOfPersona = [seed.users.staffOne, seed.users.staffPanelEvaluator];
const panelWithoutPersona = [seed.users.staffPanelEvaluator, seed.users.staffPanelChair];

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function detailsShown(surface: Surface): Promise<string[]> {
  const view = surface.opportunitySwuView;
  return [
    await readOrEmpty(() => view.status()),
    await readOrEmpty(() => view.proposalDeadline()),
    await readOrEmpty(() => view.totalMaxBudget()),
    await readOrEmpty(() => view.phases()),
  ].map((detail) => detail.trim());
}

async function administratorDraftWithPanel(
  surface: Surface,
  title: string,
  members: ReadonlyArray<{ id: string }>,
): Promise<{ opportunityId: string; creatorSees: string[] }> {
  for (const member of members) {
    expect(member.id, "the panel member is the account that created the opportunity").not.toBe(
      seed.users.administratorOne.id,
    );
  }

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.evaluationPanelSwu.open({ opportunityId });
  for (const member of members) {
    await surface.evaluationPanelSwu.addPanelMember({ member });
  }
  await surface.evaluationPanelSwu.saveEvaluationPanel();

  await surface.opportunitySwuView.open({ opportunityId });
  const creatorSees = await detailsShown(surface);
  await surface.signOut();
  return { opportunityId, creatorSees };
}

test("A panel member may open an opportunity they sit on the panel for even before it is public", async ({
  surface,
}) => {
  const { opportunityId, creatorSees } = await administratorDraftWithPanel(
    surface,
    "R-5.19 draft opportunity a panel member opens",
    panelOfPersona,
  );

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.opportunitySwuView.open({ opportunityId });

  await expect
    .poll(() => readOrEmpty(() => surface.opportunitySwuView.opportunityIdentifier()), settle)
    .toBe(opportunityId);
  const memberSees = await detailsShown(surface);
  const shared = creatorSees.filter((detail, i) => detail.length > 0 && memberSees[i] === detail);
  expect(shared, "the panel member was shown none of the opportunity's details").not.toEqual([]);
});

test("A panel member's opportunity is listed for them under a separate heading for work they are evaluating", async ({
  surface,
}) => {
  const title = "R-5.19 draft opportunity listed for the people evaluating it";
  await administratorDraftWithPanel(surface, title, panelOfPersona);

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationPanelDashboard.open();
  await expect.poll(() => readOrEmpty(() => surface.evaluationPanelDashboard.evaluationsTab()), settle).toMatch(/evaluation/i);
  await surface.evaluationPanelDashboard.showPanelOpportunities();

  await expect
    .poll(() => readOrEmpty(() => surface.evaluationPanelDashboard.panelOpportunitiesTable()), settle)
    .toContain(title);
});

test("A draft opportunity is not seen at all by a public sector employee who neither created it nor sits on its panel", async ({
  surface,
}) => {
  const title = "R-5.19 draft opportunity hidden from an unrelated employee";
  const { opportunityId, creatorSees } = await administratorDraftWithPanel(surface, title, panelWithoutPersona);
  expect(creatorSees.some((detail) => detail.length > 0), "the draft's own screen showed its creator nothing").toBe(true);

  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationPanelDashboard.open();
  expect(
    await readOrEmpty(async () => {
      await surface.evaluationPanelDashboard.showPanelOpportunities();
      return surface.evaluationPanelDashboard.panelOpportunitiesTable();
    }),
  ).not.toContain(title);

  await surface.opportunityDashboard.open();
  expect(await readOrEmpty(() => surface.opportunityDashboard.myOpportunitiesTable())).not.toContain(title);

  await surface.opportunityList.open();
  expect(await readOrEmpty(() => surface.opportunityList.unpublishedGroup())).not.toContain(title);
  expect(await readOrEmpty(() => surface.opportunityList.openGroup())).not.toContain(title);
  expect(await readOrEmpty(() => surface.opportunityList.closedGroup())).not.toContain(title);

  await surface.opportunitySwuView.open({ opportunityId });
  const strangerSees = await detailsShown(surface);
  const shown = creatorSees.filter((detail, i) => detail.length > 0 && strangerSees[i] === detail);
  expect(shown, "an unrelated employee was shown the draft's details").toEqual([]);
});
