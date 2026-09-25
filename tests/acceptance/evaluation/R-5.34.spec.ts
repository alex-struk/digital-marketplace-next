// criterion: @R-5.34 v2
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The four tools an evaluation is split into are the four tabs opportunity-swu-edit offers:
// instructions_tab and evaluation_tab (the evaluation instructions and the individual
// evaluation list), consensus_tab (the consensus list) and evaluation_panel_tab (the panel).
// Each is read as there or not for the signed-in person.
//
// One sign-in, persona.publicSectorStaff (users.staffOne), stands in each of the four
// relationships the criterion names, on four seeded Sprint With Us opportunities being
// evaluated:
//   - swuEvaluatorNotOwnerNorChair: an evaluator, neither the owner nor the chair;
//   - swuLapsedChairNotEvaluator: the chair, neither an evaluator nor the owner;
//   - swuLapsedOwnerOffPanel: the owner, not on the panel;
//   - swuCodeChallengeOfOtherStaff: no connection to it at all.
// The two lapsed ones are closed into evaluation by the scheduled transitions first.
// The administrator is looked with on swuLapsedChairNotEvaluator, where they are an
// evaluator but neither the chair nor the owner, so the consensus and the panel they are
// offered there come from being an administrator.

const settle = { timeout: 15000 };
const evaluatorOnly = seed.opportunities.swuEvaluatorNotOwnerNorChair.id;
const chairOnly = seed.opportunities.swuLapsedChairNotEvaluator.id;
const ownerOnly = seed.opportunities.swuLapsedOwnerOffPanel.id;
const unconnected = seed.opportunities.swuCodeChallengeOfOtherStaff.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function closeLapsedOpportunities(surface: Surface) {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

test("The tools for evaluating an opportunity are split by role: an evaluator is offered the evaluation instructions and the individual evaluations, and not the consensus or the panel", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuEdit.open({ opportunityId: evaluatorOnly });
  const edit = surface.opportunitySwuEdit;

  await expect.poll(() => readOrEmpty(() => edit.instructionsTab()), settle).toBeTruthy();
  await expect.poll(() => readOrEmpty(() => edit.evaluationTab()), settle).toBeTruthy();
  expect(await readOrEmpty(() => edit.consensusTab())).toBeFalsy();
  expect(await readOrEmpty(() => edit.evaluationPanelTab())).toBeFalsy();
});

test("The tools for evaluating an opportunity are split by role: the chair is offered the consensus, and not the evaluation instructions, the individual evaluations or the panel", async ({
  surface,
}) => {
  await closeLapsedOpportunities(surface);

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuEdit.open({ opportunityId: chairOnly });
  const edit = surface.opportunitySwuEdit;

  await expect.poll(() => readOrEmpty(() => edit.consensusTab()), settle).toBeTruthy();
  expect(await readOrEmpty(() => edit.instructionsTab())).toBeFalsy();
  expect(await readOrEmpty(() => edit.evaluationTab())).toBeFalsy();
  expect(await readOrEmpty(() => edit.evaluationPanelTab())).toBeFalsy();
});

test("The tools for evaluating an opportunity are split by role: the opportunity's owner is offered the consensus and the panel, and not the evaluation instructions or the individual evaluations", async ({
  surface,
}) => {
  await closeLapsedOpportunities(surface);

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuEdit.open({ opportunityId: ownerOnly });
  const edit = surface.opportunitySwuEdit;

  await expect.poll(() => readOrEmpty(() => edit.consensusTab()), settle).toBeTruthy();
  await expect.poll(() => readOrEmpty(() => edit.evaluationPanelTab()), settle).toBeTruthy();
  expect(await readOrEmpty(() => edit.instructionsTab())).toBeFalsy();
  expect(await readOrEmpty(() => edit.evaluationTab())).toBeFalsy();
});

test("The tools for evaluating an opportunity are split by role: an unrelated public sector employee is offered none of them", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuEdit.open({ opportunityId: unconnected });
  const edit = surface.opportunitySwuEdit;

  expect(await readOrEmpty(() => edit.instructionsTab())).toBeFalsy();
  expect(await readOrEmpty(() => edit.evaluationTab())).toBeFalsy();
  expect(await readOrEmpty(() => edit.consensusTab())).toBeFalsy();
  expect(await readOrEmpty(() => edit.evaluationPanelTab())).toBeFalsy();
});

test("The tools for evaluating an opportunity are split by role: an administrator sees the consensus list and the panel itself", async ({
  surface,
}) => {
  await closeLapsedOpportunities(surface);

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ opportunityId: chairOnly });
  const edit = surface.opportunitySwuEdit;

  await expect.poll(() => readOrEmpty(() => edit.consensusTab()), settle).toBeTruthy();
  await expect.poll(() => readOrEmpty(() => edit.evaluationPanelTab()), settle).toBeTruthy();
});
