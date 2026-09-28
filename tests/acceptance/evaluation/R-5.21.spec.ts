// criterion: @R-5.21 v1
// provenance: blind, spec@f31700e000484947669c48e50cf9c73b4d1e20c7, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Both records are seeded lapsed Sprint With Us opportunities, which the application closes into
// individual question evaluation once scheduled-transition-trigger is requested:
//   - swuLapsedChairNotEvaluator names users.staffOne (persona.publicSectorStaff) as a chair who
//     does not evaluate, and users.administratorOne as its one evaluator;
//   - swuLapsedOwnerOffPanel belongs to users.staffOne, who is not on its panel.
//
// Every test first establishes the given: the opportunity reads as in individual question
// evaluation on its own page, reached by the bounded procedure in observables.yaml
// (scheduled_transitions). Nothing is attempted until it does.
//
// An attempt to score is a score and a comment for the first question, then saving the draft.
// The criterion says only that the attempt is refused, so either of two things is the refusal:
// the scoring form is not offered to that person (an action on it fails), or the attempt goes
// through the form and afterwards no evaluation by that person exists — the evaluation
// addressed by their own account carries no status and no scores. The evaluator's attempt is
// the contrast: afterwards an evaluation by them exists, holding the score they entered.

const settle = { timeout: 15000 };
const score = 3;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return ((await read()) ?? "").trim();
  } catch {
    return "";
  }
}

function inIndividualEvaluation(status: string): boolean {
  const s = status.toLowerCase();
  return /evaluat|question/.test(s) && !/consensus|draft|publish/.test(s);
}

// observables.yaml, scheduled_transitions: trigger; read the status every 500 ms; trigger again
// if it has not changed three seconds after the last trigger; fail after thirty seconds.
async function untilInIndividualEvaluation(surface: Surface, opportunityId: string): Promise<void> {
  const started = Date.now();
  let lastTrigger = 0;
  let triggers = 0;
  let status = "";
  while (Date.now() - started < 30000) {
    if (Date.now() - lastTrigger >= 3000) {
      await surface.scheduledTransitionTrigger.open();
      await surface.scheduledTransitionTrigger.runPendingTransitions();
      lastTrigger = Date.now();
      triggers += 1;
    }
    await surface.opportunitySwuView.open({ opportunityId });
    status = await readOrEmpty(() => surface.opportunitySwuView.status());
    if (inIndividualEvaluation(status)) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `the opportunity did not read as in individual question evaluation within thirty seconds; last status "${status}" after ${triggers} trigger requests`,
  );
}

// True when every step of the attempt was offered and taken; false when the form withheld one.
async function attemptToScore(surface: Surface, params: { opportunityId: string; proposalId: string }): Promise<boolean> {
  try {
    await surface.evaluationIndividualCreateSwu.open(params);
    await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order: 0, score });
    await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ order: 0, notes: "A fair answer to the question." });
    await surface.evaluationIndividualCreateSwu.saveDraft();
    return true;
  } catch {
    return false;
  }
}

async function evaluationBy(surface: Surface, proposalId: string, userId: string): Promise<{ status: string; scores: string }> {
  await surface.evaluationIndividualRequestSwu.open({ proposalId, userId });
  return {
    status: await readOrEmpty(() => surface.evaluationIndividualRequestSwu.evaluationStatus()),
    scores: await readOrEmpty(() => surface.evaluationIndividualRequestSwu.storedScores()),
  };
}

async function expectRefused(surface: Surface, opportunityId: string, proposalId: string): Promise<void> {
  const offered = await attemptToScore(surface, { opportunityId, proposalId });
  if (!offered) return;
  const recorded = await evaluationBy(surface, proposalId, seed.users.staffOne.id);
  expect(recorded.status).toBe("");
  expect(recorded.scores).not.toMatch(new RegExp(`\\b${score}(\\.0+)?\\b`));
}

test("Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation (the chair who is not an evaluator is refused)", async ({
  surface,
}) => {
  const opportunityId = seed.opportunities.swuLapsedChairNotEvaluator.id;
  await surface.signIn(persona.publicSectorStaff);
  await untilInIndividualEvaluation(surface, opportunityId);

  await expectRefused(surface, opportunityId, seed.proposals.swuChairNotEvaluatorOne.id);
});

test("Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation (the opportunity's owner who is not on the panel is refused)", async ({
  surface,
}) => {
  const opportunityId = seed.opportunities.swuLapsedOwnerOffPanel.id;
  await surface.signIn(persona.publicSectorStaff);
  await untilInIndividualEvaluation(surface, opportunityId);

  await expectRefused(surface, opportunityId, seed.proposals.swuOwnerOffPanelOne.id);
});

test("Only a person marked as an evaluator on the panel may record an individual evaluation, and only while the opportunity is in individual question evaluation (an evaluator on the panel may score)", async ({
  surface,
}) => {
  const opportunityId = seed.opportunities.swuLapsedChairNotEvaluator.id;
  const proposalId = seed.proposals.swuChairNotEvaluatorOne.id;
  await surface.signIn(persona.administrator);
  await untilInIndividualEvaluation(surface, opportunityId);

  expect(await attemptToScore(surface, { opportunityId, proposalId })).toBe(true);

  await expect
    .poll(async () => (await evaluationBy(surface, proposalId, seed.users.administratorOne.id)).status, settle)
    .not.toBe("");
  expect((await evaluationBy(surface, proposalId, seed.users.administratorOne.id)).scores).toMatch(
    new RegExp(`\\b${score}(\\.0+)?\\b`),
  );
});
