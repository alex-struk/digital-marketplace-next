// criterion: @R-5.19 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-09
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The opportunity is a draft made by an administrator, so it is not public and its panel
// member did not create it — the two things that make the criterion's claim worth anything.
// The panel names the account the public sector sign-in mints, because that is the only
// person a test can both put on a panel and then act as.
//
// The contrast the criterion draws at the end — that another public sector employee cannot
// see the opportunity at all — is not asserted. The only other public sector account that
// can be signed in as is the administrator, who sees every opportunity there is, so a test
// could not tell the panel's reach from an administrator's.

async function draftForPanelMember(surface: Surface, title: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  await surface.evaluationPanelSwu.open({ title });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.addPanelMember({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.markMemberAsChair({ member: seed.users.staffPanelEvaluator });
  await surface.evaluationPanelSwu.saveEvaluationPanel();
  await surface.signOut();
}

test("a panel member may open an opportunity they sit on the panel for even before it is public", async ({
  surface,
}) => {
  const title = "R-5.19 draft opportunity a panel member opened";

  await draftForPanelMember(surface, title);

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.opportunitySwuView.open({ title });
  expect((await surface.opportunitySwuView.status()).toLowerCase()).toContain("draft");
});

test("an opportunity is listed for its panel members under a separate heading for work they are evaluating", async ({
  surface,
}) => {
  const title = "R-5.19 draft opportunity listed for the people evaluating it";

  await draftForPanelMember(surface, title);

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationPanelDashboard.open();
  await surface.evaluationPanelDashboard.showPanelOpportunities();

  expect(await surface.evaluationPanelDashboard.evaluationsTab()).toBeTruthy();
  expect(await surface.evaluationPanelDashboard.panelOpportunitiesTable()).toContain(title);
});
