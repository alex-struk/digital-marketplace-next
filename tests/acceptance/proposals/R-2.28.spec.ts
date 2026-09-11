// criterion: @R-2.28 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Both seeded opportunities land in the first evaluation stage — review of the questions —
// as soon as the service's deadline hook runs, which is what run_pending_transitions asks
// for. Every action the two proposal views offer beyond that stage is therefore an action
// taken at the wrong stage, and wrong_stage_error is the observation written for exactly
// this refusal.
//
// The administrator makes the attempt, so that nothing about who is asking can account for
// the refusal: an administrator may take every one of these actions at the stage each
// belongs to.
//
// Neither test changes anything. A refused action leaves the opportunity where it was, so
// the seeded pair is left as the closing hook left it for the criteria that read it.
//
// The other half of the criterion — that proposals do advance through the stages one at a
// time — is not asserted. Advancing one stage means scoring every proponent's questions,
// agreeing those scores as a panel and finalising them, and the seed carries one closed
// opportunity per program: the first test to walk that path consumes it, and every
// criterion behind it would then be measured on an opportunity some other test had moved.
// See the entries for R-2.29 through R-2.33 in not-testable.yaml.

async function closeOverdueOpportunities(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

test("a Sprint With Us action taken at the wrong stage of the opportunity is refused", async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  const where = {
    opportunityId: seed.opportunities.closedSprintWithUs.id,
    proposalId: seed.proposals.sprintWithUsOne.id,
  };

  await surface.signIn(persona.administrator);

  await surface.proposalSwuView.open(where);
  await surface.proposalSwuView.scoreTeamScenario({ score: 80 });
  expect(await surface.proposalSwuView.wrongStageError()).toBeTruthy();

  await surface.proposalSwuView.open(where);
  await surface.proposalSwuView.scoreCodeChallenge({ score: 80 });
  expect(await surface.proposalSwuView.wrongStageError()).toBeTruthy();

  await surface.proposalSwuView.open(where);
  await surface.proposalSwuView.screenInToTeamScenario();
  expect(await surface.proposalSwuView.wrongStageError()).toBeTruthy();
});

test("a Team With Us action taken at the wrong stage of the opportunity is refused", async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  const where = {
    opportunityId: seed.opportunities.closedTeamWithUs.id,
    proposalId: seed.proposals.teamWithUsOne.id,
  };

  await surface.signIn(persona.administrator);

  await surface.proposalTwuView.open(where);
  await surface.proposalTwuView.scoreChallenge({ score: 80 });
  expect(await surface.proposalTwuView.wrongStageError()).toBeTruthy();

  await surface.proposalTwuView.open(where);
  await surface.proposalTwuView.screenInToChallenge();
  expect(await surface.proposalTwuView.wrongStageError()).toBeTruthy();
});
