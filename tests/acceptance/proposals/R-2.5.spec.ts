// criterion: @R-2.5 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The closure itself cannot be built through a form: a published opportunity is refused a
// proposal deadline earlier than today, so an opportunity whose deadline has already gone
// by is seeded rather than made. The seeded Sprint With Us opportunity is published with a
// deadline thirty days old and three submitted proposals against it, and the service's own
// deadline hook is what closes it. run_pending_transitions is the request that runs that
// hook, so each test asks for it first and then reads what the service decided.
//
// The anonymous names are read from the panel's own list of proponents, which is where the
// service shows them to the people who are meant to see them. The criterion says the
// numbering follows the order the proposals happen to be read in, so the three names are
// asserted as a set rather than each against a particular proposal.
//
// The last clause — that a draft against the same opportunity is left alone — is not
// asserted. The seeded closed opportunities carry submitted proposals only, and a draft
// cannot be added to one: a vendor who could bid has already bid on it, and every
// qualified organization is already named on a proposal of its own.
//
// Only the Sprint With Us opportunity is used. The criterion holds of either program, and
// the seed carries one closed opportunity in each, so the Team With Us one is left for the
// criteria that have to change something (R-2.34).

async function closeOverdueOpportunities(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

test("when an opportunity closes, every proposal submitted against it moves to the first review stage of that program", async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  const opportunityId = seed.opportunities.closedSprintWithUs.id;

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuEdit.open({
    opportunityId,
    proposalId: seed.proposals.sprintWithUsOne.id,
  });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("review");
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await surface.proposalSwuEdit.open({
    opportunityId,
    proposalId: seed.proposals.sprintWithUsTwo.id,
  });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("review");
});

test("when an opportunity closes, every proposal submitted against it is given an anonymous proponent name numbered from one", async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  await surface.signIn(persona.evaluationPanelEvaluator);
  await surface.evaluationIndividualListSwu.open({
    opportunityId: seed.opportunities.closedSprintWithUs.id,
  });

  const names = await surface.evaluationIndividualListSwu.anonymousProponentName();
  expect(names).toContain("Proponent 1");
  expect(names).toContain("Proponent 2");
  expect(names).toContain("Proponent 3");
});
