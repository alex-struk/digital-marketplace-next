// criterion: @R-5.19 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.19 draft Sprint With Us opportunity with a panel";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

// A draft — never published — whose panel names a public sector employee who did not
// create it.
async function aDraftWhosePanelNamesSomebodyElse(surface: Surface) {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.addPhase({ phase: "implementation" });
  await surface.opportunitySwuCreate.addTeamQuestion({ question: QUESTION, maximumScore: 5, minimumScore: 1 });
  await surface.opportunitySwuCreate.setEvaluationPanel({
    evaluators: [seed.users.staffPanelEvaluator],
    chair: seed.users.staffPanelChair,
  });
  await surface.opportunitySwuCreate.saveDraft({ title: TITLE, proposalDeadline: momentsFromNow() });
  await surface.signOut();
}

test("a panel member may open an opportunity they sit on the panel for even before it is public, and it is listed for them under a separate heading for work they are evaluating", async ({ surface }) => {
  await aDraftWhosePanelNamesSomebodyElse(surface);

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationPanelDashboard.open();
  await surface.evaluationPanelDashboard.showPanelOpportunities();

  expect(await surface.evaluationPanelDashboard.evaluationsTab()).toBeTruthy();
  expect(await surface.evaluationPanelDashboard.panelOpportunitiesTable()).toContain(TITLE);

  await surface.evaluationPanelDashboard.openOpportunity({ title: TITLE });
  expect(await surface.opportunitySwuView.status()).toMatch(/draft/i);
});

test("another public sector employee cannot see it at all", async ({ surface }) => {
  await aDraftWhosePanelNamesSomebodyElse(surface);

  await surface.signIn(persona.publicSectorStaffOther);
  await surface.evaluationPanelDashboard.open();
  await surface.evaluationPanelDashboard.showPanelOpportunities();

  expect(await surface.evaluationPanelDashboard.panelOpportunitiesTable()).not.toContain(TITLE);
});
