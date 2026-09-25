// criterion: @R-5.21 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Both records are seeded lapsed Sprint With Us opportunities, which the application closes into
// individual question evaluation on the first request to scheduled-transition-trigger:
//   - swuLapsedChairNotEvaluator names users.staffOne (persona.publicSectorStaff) as a chair who
//     does not evaluate, and users.administratorOne as its one evaluator;
//   - swuLapsedOwnerOffPanel belongs to users.staffOne, who is not on its panel.
//
// An attempt to score is the whole of what a person does on the create screen: a score and a
// comment for the first question, then saving the draft. The attempt is refused when
// refused_when_not_permitted reports it, which tells a refusal from a form that simply recorded
// nothing. The evaluator's attempt is the contrast: nothing is refused, and the evaluation they
// recorded can be opened afterwards as theirs.

const settle = { timeout: 15000 };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function closeLapsed(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

async function attemptToScore(surface: Surface, params: { opportunityId: string; proposalId: string }): Promise<void> {
  await surface.evaluationIndividualCreateSwu.open(params);
  try {
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 0, score: 3 });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ order: 0, notes: "A fair answer to the question." });
    await surface.evaluationIndividualCreateSwu.saveDraft();
  } catch {
    // The form was not offered; whether that is a refusal is read below.
  }
}

test("Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation (the chair who is not an evaluator is refused)", async ({
  surface,
}) => {
  await closeLapsed(surface);
  await surface.signIn(persona.publicSectorStaff);

  await attemptToScore(surface, {
    opportunityId: seed.opportunities.swuLapsedChairNotEvaluator.id,
    proposalId: seed.proposals.swuChairNotEvaluatorOne.id,
  });

  await expect
    .poll(() => readOrEmpty(() => surface.evaluationIndividualCreateSwu.refusedWhenNotPermitted()), settle)
    .toBeTruthy();
});

test("Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation (the opportunity's owner who is not on the panel is refused)", async ({
  surface,
}) => {
  await closeLapsed(surface);
  await surface.signIn(persona.publicSectorStaff);

  await attemptToScore(surface, {
    opportunityId: seed.opportunities.swuLapsedOwnerOffPanel.id,
    proposalId: seed.proposals.swuOwnerOffPanelOne.id,
  });

  await expect
    .poll(() => readOrEmpty(() => surface.evaluationIndividualCreateSwu.refusedWhenNotPermitted()), settle)
    .toBeTruthy();
});

test("Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation (an evaluator on the panel may score)", async ({
  surface,
}) => {
  await closeLapsed(surface);
  await surface.signIn(persona.administrator);

  const opportunityId = seed.opportunities.swuLapsedChairNotEvaluator.id;
  const proposalId = seed.proposals.swuChairNotEvaluatorOne.id;
  await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 0, score: 3 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ order: 0, notes: "A fair answer to the question." });
  await surface.evaluationIndividualCreateSwu.saveDraft();
  expect(await readOrEmpty(() => surface.evaluationIndividualCreateSwu.refusedWhenNotPermitted())).toBeFalsy();

  await surface.evaluationIndividualEditSwu.open({ opportunityId, proposalId, userId: seed.users.administratorOne.id });
  await expect.poll(() => readOrEmpty(() => surface.evaluationIndividualEditSwu.evaluationStatus()), settle).toBeTruthy();
  expect(await readOrEmpty(() => surface.evaluationIndividualEditSwu.refusedWhenNotPermitted())).toBeFalsy();
});
