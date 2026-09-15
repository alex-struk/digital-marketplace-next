// criterion: @R-5.19 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The opportunity is a Sprint With Us draft made by the administrator, so it is not public
// and nobody else on its panel created it. A new draft names its creator as chair already,
// so the panel is completed by adding people rather than by marking a second chair.
//
// Who the panel member persona signs in as depends on the target — users.staffOne on the
// oracle, users.staffPanelEvaluator elsewhere — so the first two tests put both on the panel.
// That the member opened this opportunity, rather than being shown some page, is read from
// the opportunity's own identifier and from its details matching what its creator is shown;
// the status label is not used, since the criterion never says a member is told the state.
//
// The third test is the contrast the criterion draws. Its panel leaves users.staffOne off,
// so the public sector employee persona is somebody who neither created the draft nor sits on
// its panel and is not an administrator, on every target. "Cannot see it at all" is read from
// every place such a person could find it — both dashboard lists, the opportunity list, and
// the opportunity's own details, which must not be shown to them.

const settle = { timeout: 15000 };

async function adminDraftWithPanel(
  surface: Surface,
  title: string,
  members: ReadonlyArray<{ id: string }>,
): Promise<{ opportunityId: string; createdBy: string }> {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();
  await surface.evaluationPanelSwu.open({ opportunityId });
  for (const member of members) {
    await surface.evaluationPanelSwu.addPanelMember({ member });
  }
  await surface.evaluationPanelSwu.saveEvaluationPanel();
  await surface.opportunitySwuView.open({ opportunityId });
  const createdBy = await surface.opportunitySwuView.createdByName();
  expect(createdBy).toBeTruthy();
  await surface.signOut();
  return { opportunityId, createdBy };
}

async function readOrNothing(read: () => Promise<string>): Promise<string> {
  try {
    return await read();
  } catch {
    return "";
  }
}

test("A panel member may open an opportunity they sit on the panel for even before it is public", async ({
  surface,
}) => {
  const { opportunityId, createdBy } = await adminDraftWithPanel(
    surface,
    "R-5.19 draft opportunity a panel member opens",
    [seed.users.staffOne, seed.users.staffPanelEvaluator],
  );

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.opportunitySwuView.open({ opportunityId });

  expect(await surface.opportunitySwuView.opportunityIdentifier()).toBe(opportunityId);
  await expect.poll(() => readOrNothing(() => surface.opportunitySwuView.createdByName()), settle).toBe(createdBy);
});

test("A panel member's opportunity is listed for them under a separate heading for work they are evaluating", async ({
  surface,
}) => {
  const title = "R-5.19 draft opportunity listed for the people evaluating it";
  await adminDraftWithPanel(surface, title, [seed.users.staffOne, seed.users.staffPanelEvaluator]);

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationPanelDashboard.open();
  expect(await surface.evaluationPanelDashboard.evaluationsTab()).toBeTruthy();
  await surface.evaluationPanelDashboard.showPanelOpportunities();

  await expect
    .poll(() => readOrNothing(() => surface.evaluationPanelDashboard.panelOpportunitiesTable()), settle)
    .toContain(title);
});

test("A draft opportunity is not seen at all by a public sector employee who neither created it nor sits on its panel", async ({
  surface,
}) => {
  const title = "R-5.19 draft opportunity hidden from an unrelated employee";
  const { opportunityId, createdBy } = await adminDraftWithPanel(surface, title, [
    seed.users.staffPanelEvaluator,
    seed.users.staffPanelChair,
  ]);

  await surface.signIn(persona.publicSectorStaff);

  await surface.evaluationPanelDashboard.open();
  expect(
    await readOrNothing(async () => {
      await surface.evaluationPanelDashboard.showPanelOpportunities();
      return surface.evaluationPanelDashboard.panelOpportunitiesTable();
    }),
  ).not.toContain(title);

  await surface.opportunityDashboard.open();
  expect(await readOrNothing(() => surface.opportunityDashboard.myOpportunitiesTable())).not.toContain(title);

  await surface.opportunityList.open();
  expect(await readOrNothing(() => surface.opportunityList.unpublishedGroup())).not.toContain(title);
  expect(await readOrNothing(() => surface.opportunityList.openGroup())).not.toContain(title);
  expect(await readOrNothing(() => surface.opportunityList.closedGroup())).not.toContain(title);

  await surface.opportunitySwuView.open({ opportunityId });
  expect(await readOrNothing(() => surface.opportunitySwuView.createdByName())).not.toBe(createdBy);
});
