// criterion: @R-1.49 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a Team With Us opportunity in processing. The seed carries one a step short of
// it — at the challenge, with one proponent scored and the other the last left to score —
// because the old application's store would not hold a Team With Us opportunity in processing.
// The administrator enters that last score, which is what moves an opportunity to processing,
// and the opportunity is shown to read as in processing before anything else is asked of it.
//
// The recorded transitions are read as the changes of state the management screen offers from
// processing: award and cancel must both be among them. The award path is read by the
// administrator awarding the proposal scored first and the opportunity then reading as awarded,
// so that what is offered and what the award does agree.

const statement =
  "The permitted state changes for a Team With Us opportunity in processing are awarded and cancelled, matching Code With Us and Sprint With Us, so the recorded transitions and the award path agree.";

const settle = { timeout: 30000 };
const opportunityId = seed.opportunities.twuChallengeLastToScore.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function status(surface: Surface): Promise<string> {
  await surface.opportunityTwuView.open({ opportunityId });
  return (await readOrEmpty(() => surface.opportunityTwuView.status())).toLowerCase();
}

async function inProcessing(surface: Surface): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.proposalTwuView.open({ opportunityId, proposalId: seed.proposals.twuChallengeLast.id });
  await surface.proposalTwuView.scoreChallenge({ score: 80 });
  await expect.poll(() => status(surface), settle).toMatch(/processing/);
}

test(`${statement} (the changes offered from processing are award and cancel)`, async ({ surface }) => {
  await inProcessing(surface);

  await surface.opportunityTwuEdit.open({ opportunityId });
  await expect.poll(() => readOrEmpty(() => surface.opportunityTwuEdit.offeredStateChanges()), settle).toBeTruthy();
  const offered = (await surface.opportunityTwuEdit.offeredStateChanges()).toLowerCase();
  expect(offered).toMatch(/award/);
  expect(offered).toMatch(/cancel/);
});

test(`${statement} (awarding a proposal moves it from processing to awarded)`, async ({ surface }) => {
  await inProcessing(surface);

  await surface.proposalTwuView.open({ opportunityId, proposalId: seed.proposals.twuChallengeScored.id });
  await surface.proposalTwuView.awardProposal();

  await expect.poll(() => status(surface), settle).toMatch(/awarded/);
});
