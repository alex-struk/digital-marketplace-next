// criterion: @R-5.20 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The seeded Sprint With Us opportunity is published with a deadline thirty days gone, so
// the closure the criterion describes is the application's own work and the transition
// trigger is only the request that lets it happen. Both halves of the then belong to that
// one event, so they are one test: a second run of the trigger would find the opportunity
// already closed and send nothing, and the messages would then be missing for a reason that
// has nothing to do with the rule.
//
// For the same reason the catcher is emptied immediately before the trigger and the first
// thing the test does is trigger: whatever else a suite run has done, the closing messages
// belong to the request made here.
//
// The stage is read from the opportunity's own status rather than from a page only an
// evaluator is offered, and asserted by the questions it names, because the individual
// stage is the one in which the questions are scored one evaluator at a time.
//
// The contrast the criterion draws — that a chair who is not an evaluator is not told — is
// not asserted. The seeded panel's chair is also an evaluator, because the target mints
// sessions for two public sector accounts and consensus needs both of them to score, so no
// panel a test can reach has a chair who does not evaluate.

test("when an opportunity closes it enters individual question evaluation and its evaluators are told", async ({
  surface,
  mail,
}) => {
  await mail.clear();

  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuView.open({ opportunityId: seed.opportunities.closedSprintWithUs.id });
  expect((await surface.opportunitySwuView.status()).toLowerCase()).toContain("question");

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.staffOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await mail.messagesTo(seed.users.administratorOne.email)).length, {
      timeout: 10000,
    })
    .toBeGreaterThan(0);
});
