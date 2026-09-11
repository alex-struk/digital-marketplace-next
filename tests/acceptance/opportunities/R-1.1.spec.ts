// criterion: @R-1.1 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The given is a published opportunity whose proposal deadline has already gone by, which
// no form will accept and which the seed therefore carries ready-made: two opportunities,
// one in each of the two programs that have proposals, published with a deadline thirty
// days in the past. The when is the request that runs the closing hook, which the surface
// names as the scheduled transition trigger.
//
// The notification is asserted first because the closure happens once. A trigger that runs
// after the opportunities have already closed does nothing and sends nothing, so a reading
// that counts messages before and against after only holds for the first trigger of a run.

test("a published opportunity whose proposal deadline has passed notifies its author that it is ready for evaluation", async ({
  surface,
  mail,
}) => {
  const author = seed.users.staffOne.email;
  const before = (await mail.messagesTo(author)).length;

  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await expect
    .poll(async () => (await mail.messagesTo(author)).length, { timeout: 15000 })
    .toBeGreaterThan(before);
});

test("a published opportunity whose proposal deadline has passed closes on its own and moves to the first evaluation stage of its program", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.administrator);

  await surface.opportunitySwuView.open({ opportunityId: seed.opportunities.closedSprintWithUs.id });
  const sprint = (await surface.opportunitySwuView.status()).toLowerCase();
  expect(sprint).not.toContain("published");
  expect(sprint).toMatch(/evaluat|question/);

  await surface.opportunityTwuView.open({ opportunityId: seed.opportunities.closedTeamWithUs.id });
  const team = (await surface.opportunityTwuView.status()).toLowerCase();
  expect(team).not.toContain("published");
  expect(team).toMatch(/evaluat|question/);
});

test("every proposal submitted against a closed opportunity moves to review", async ({ surface }) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.organizationOwner);

  await surface.proposalSwuEdit.open({
    opportunityId: seed.opportunities.closedSprintWithUs.id,
    proposalId: seed.proposals.sprintWithUsOne.id,
  });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("review");

  await surface.proposalTwuEdit.open({
    opportunityId: seed.opportunities.closedTeamWithUs.id,
    proposalId: seed.proposals.teamWithUsOne.id,
  });
  expect((await surface.proposalTwuEdit.status()).toLowerCase()).toContain("review");
});
