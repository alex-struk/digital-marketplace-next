// criterion: @R-1.1 v3
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity whose proposal deadline has already gone by. No form
// accepts such a deadline, so the seed carries it for the two programs that have one ready:
// a Sprint With Us and a Team With Us opportunity, each published with a deadline thirty days
// in the past, three submitted proposals and a panel of two evaluators. No Code With Us
// opportunity past its deadline is seeded, so the Code With Us half — the announcement to the
// author — has nothing to close and is not exercised here. The when is a request the service
// handles under /status, which the surface names as the scheduled transition trigger.
//
// Closure runs inside the service and a screen shows its result only once it has finished,
// so every reading below is repeated until the new state appears rather than taken once. Each
// is made by somebody entitled to see it: an administrator for the opportunity, and each
// proposal's own proponent for that proposal. The third proposal on each opportunity belongs
// to a proponent no persona signs in as, so the two proposals a proponent can read are the
// ones checked.
//
// The announcement goes to a group, and a message to a group is addressed to one person with
// the rest as blind copies, which `mail` cannot read. So the announcement is looked for, by
// the title of the opportunity that closed, among the messages addressed to any of the panel's
// evaluators, and a blind copy reaching the others cannot be confirmed. The seeded author also
// sits on both panels as an evaluator, so the message cannot be told apart from one sent to
// the author instead.

const statement =
  "A published opportunity whose proposal deadline has passed closes on its own at the next request the service handles under /api or /status: it moves to the first evaluation stage of its program, every proposal submitted against it moves to review, and it is announced as ready for evaluation, to its author for a Code With Us opportunity and to the evaluators on its evaluation panel for a Sprint With Us or Team With Us opportunity.";

const settle = { timeout: 30000 };

const accounts = seed.users as unknown as Record<string, { email: string | null }>;

function evaluatorsOf(panel: { members: readonly { user: string; evaluator: boolean }[] }): string[] {
  return panel.members
    .filter((member) => member.evaluator)
    .map((member) => accounts[member.user.replace(/^users\./, "")]?.email)
    .filter((email): email is string => Boolean(email));
}

async function close(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

async function sprintStatus(surface: Surface): Promise<string> {
  await surface.opportunitySwuView.open({ opportunityId: seed.opportunities.closedSprintWithUs.id });
  return (await surface.opportunitySwuView.status()).toLowerCase();
}

async function teamStatus(surface: Surface): Promise<string> {
  await surface.opportunityTwuView.open({ opportunityId: seed.opportunities.closedTeamWithUs.id });
  return (await surface.opportunityTwuView.status()).toLowerCase();
}

async function sprintProposalStatus(surface: Surface, proposalId: string): Promise<string> {
  await surface.proposalSwuEdit.open({ opportunityId: seed.opportunities.closedSprintWithUs.id, proposalId });
  return (await surface.proposalSwuEdit.status()).toLowerCase();
}

async function teamProposalStatus(surface: Surface, proposalId: string): Promise<string> {
  await surface.proposalTwuEdit.open({ opportunityId: seed.opportunities.closedTeamWithUs.id, proposalId });
  return (await surface.proposalTwuEdit.status()).toLowerCase();
}

test(`${statement} (it moves to the first evaluation stage of its program)`, async ({ surface }) => {
  await close(surface);
  await surface.signIn(persona.administrator);

  await expect.poll(() => sprintStatus(surface), settle).toMatch(/evaluat|question/);
  expect(await sprintStatus(surface)).not.toContain("published");
  await expect
    .poll(async () => {
      await surface.opportunitySwuEdit.open({ opportunityId: seed.opportunities.closedSprintWithUs.id });
      return surface.opportunitySwuEdit.historyTab();
    }, settle)
    .toContain("This opportunity has closed.");

  await expect.poll(() => teamStatus(surface), settle).toMatch(/evaluat|question/);
  expect(await teamStatus(surface)).not.toContain("published");
  await expect
    .poll(async () => {
      await surface.opportunityTwuEdit.open({ opportunityId: seed.opportunities.closedTeamWithUs.id });
      return surface.opportunityTwuEdit.historyTab();
    }, settle)
    .toContain("This opportunity has closed.");
});

test(`${statement} (every proposal submitted against it moves to review)`, async ({ surface }) => {
  await close(surface);

  await surface.signIn(persona.organizationOwner);
  await expect
    .poll(() => sprintProposalStatus(surface, seed.proposals.sprintWithUsOne.id), settle)
    .toContain("review");
  await expect
    .poll(() => teamProposalStatus(surface, seed.proposals.teamWithUsOne.id), settle)
    .toContain("review");
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await expect
    .poll(() => sprintProposalStatus(surface, seed.proposals.sprintWithUsTwo.id), settle)
    .toContain("review");
  await expect
    .poll(() => teamProposalStatus(surface, seed.proposals.teamWithUsTwo.id), settle)
    .toContain("review");
});

test(`${statement} (a Sprint With Us or Team With Us opportunity is announced as ready for evaluation to the evaluators on its panel)`, async ({
  surface,
  mail,
}) => {
  const sprintEvaluators = evaluatorsOf(seed.evaluation_panels.sprintWithUs);
  const teamEvaluators = evaluatorsOf(seed.evaluation_panels.teamWithUs);
  expect(sprintEvaluators.length).toBeGreaterThanOrEqual(2);
  expect(teamEvaluators.length).toBeGreaterThanOrEqual(2);

  await close(surface);

  // Looked for as present rather than counted: the closure may already have run before the
  // test could take a count, since any request under /api sets it off.
  const announced = async (addresses: string[], title: string): Promise<boolean> => {
    for (const address of addresses) {
      const messages = await mail.messagesTo(address);
      if (messages.some((m) => `${m.Subject} ${m.Snippet}`.includes(title))) return true;
    }
    return false;
  };

  await expect.poll(() => announced(sprintEvaluators, seed.opportunities.closedSprintWithUs.title), settle).toBe(true);
  await expect.poll(() => announced(teamEvaluators, seed.opportunities.closedTeamWithUs.title), settle).toBe(true);
});
