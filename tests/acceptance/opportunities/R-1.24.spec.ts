// criterion: @R-1.24 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity with submitted proposals whose deadline has gone by,
// which the seed carries for both programs that anonymise their proponents, three proposals
// each. The when is the closure, set off through the scheduled transition trigger.
//
// Before closure is set off, the given is established rather than assumed: the administrator
// must be able to open the opportunity, and each proponent a persona signs in as must be able
// to open their own submitted proposal against it. The third proposal belongs to a proponent
// no persona signs in as, so it is not opened. The service may already have closed the
// opportunity by the time these readings are made, since any request under /api sets closure
// off; what they establish is that the records are there and readable, not the moment.
//
// Closure is then not read as finished the instant it is set off: the opportunity is first
// waited for until it stands at an evaluation stage, and the names are then waited for on the
// evaluation list, which is where the criterion says they are used. The administrator sits on
// both seeded panels as chair and evaluator, so the list answers for them. Which proposal
// carries which number is the service's to choose, so the three names are looked for as a set.

const statement =
  "On closing a Sprint With Us or Team With Us opportunity, each submitted proposal is given an anonymous proponent name for use during evaluation.";

const settle = { timeout: 30000 };
const names = ["Proponent 1", "Proponent 2", "Proponent 3"];

async function close(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

function countNames(shown: string): number {
  return names.filter((name) => shown.includes(name)).length;
}

test(`${statement} (Sprint With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.closedSprintWithUs.id;

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuEdit.open({ opportunityId, proposalId: seed.proposals.sprintWithUsOne.id });
  await expect.poll(() => surface.proposalSwuEdit.proposalIdentifier(), settle).toContain(seed.proposals.sprintWithUsOne.id);
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await surface.proposalSwuEdit.open({ opportunityId, proposalId: seed.proposals.sprintWithUsTwo.id });
  await expect.poll(() => surface.proposalSwuEdit.proposalIdentifier(), settle).toContain(seed.proposals.sprintWithUsTwo.id);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuView.open({ opportunityId });
  await expect.poll(() => surface.opportunitySwuView.opportunityIdentifier(), settle).toContain(opportunityId);

  await close(surface);

  await expect
    .poll(async () => {
      await surface.opportunitySwuView.open({ opportunityId });
      return (await surface.opportunitySwuView.status()).toLowerCase();
    }, settle)
    .toMatch(/evaluat|question/);

  await expect
    .poll(async () => {
      await surface.evaluationIndividualListSwu.open({ opportunityId });
      return countNames(await surface.evaluationIndividualListSwu.anonymousProponentName());
    }, settle)
    .toBe(names.length);
});

test(`${statement} (Team With Us)`, async ({ surface }) => {
  const opportunityId = seed.opportunities.closedTeamWithUs.id;

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuEdit.open({ opportunityId, proposalId: seed.proposals.teamWithUsOne.id });
  await expect.poll(() => surface.proposalTwuEdit.proposalIdentifier(), settle).toContain(seed.proposals.teamWithUsOne.id);
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await surface.proposalTwuEdit.open({ opportunityId, proposalId: seed.proposals.teamWithUsTwo.id });
  await expect.poll(() => surface.proposalTwuEdit.proposalIdentifier(), settle).toContain(seed.proposals.teamWithUsTwo.id);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuView.open({ opportunityId });
  await expect.poll(() => surface.opportunityTwuView.opportunityIdentifier(), settle).toContain(opportunityId);

  await close(surface);

  await expect
    .poll(async () => {
      await surface.opportunityTwuView.open({ opportunityId });
      return (await surface.opportunityTwuView.status()).toLowerCase();
    }, settle)
    .toMatch(/evaluat|question/);

  await expect
    .poll(async () => {
      await surface.evaluationIndividualListTwu.open({ opportunityId });
      return countNames(await surface.evaluationIndividualListTwu.anonymousProponentName());
    }, settle)
    .toBe(names.length);
});
