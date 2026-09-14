// criterion: @R-1.24 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The given is a published opportunity with submitted proposals whose deadline has gone by,
// which the seed carries for both of the programs that anonymise their proponents. The when
// is the closure, performed through the scheduled transition trigger; the names are read off
// the evaluation list, which is where the criterion says they are for.
//
// The administrator sits on both seeded panels as chair and evaluator, so the list answers
// for them. Each proposal's label is the application's to choose, so the three names are
// looked for as a set rather than matched to a particular proposal.

test("on closing a Sprint With Us opportunity, each submitted proposal is given an anonymous proponent name", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.administrator);
  await surface.evaluationIndividualListSwu.open({
    opportunityId: seed.opportunities.closedSprintWithUs.id,
  });

  const names = await surface.evaluationIndividualListSwu.anonymousProponentName();
  expect(names).toContain("Proponent 1");
  expect(names).toContain("Proponent 2");
  expect(names).toContain("Proponent 3");
});

test("on closing a Team With Us opportunity, each submitted proposal is given an anonymous proponent name", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.administrator);
  await surface.evaluationIndividualListTwu.open({
    opportunityId: seed.opportunities.closedTeamWithUs.id,
  });

  const names = await surface.evaluationIndividualListTwu.anonymousProponentName();
  expect(names).toContain("Proponent 1");
  expect(names).toContain("Proponent 2");
  expect(names).toContain("Proponent 3");
});
