// criterion: @R-1.1 v2
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity whose proposal deadline has already gone by. No form
// accepts such a deadline, so the seed carries it for the two programs that have one ready:
// a Sprint With Us and a Team With Us opportunity, each published with a deadline thirty days
// in the past and three submitted proposals. No Code With Us opportunity past its deadline is
// seeded, so that program is not exercised here. The when is a request the service handles
// under /status, which the surface names as the scheduled transition trigger.
//
// Closure runs inside the service and a screen shows its result only once it has finished,
// so every reading below is repeated until the new state appears rather than taken once. Each
// is made by somebody entitled to see it: an administrator for the opportunity, and each
// proposal's own proponent for that proposal. The third proposal on each opportunity belongs
// to a proponent no persona signs in as, so the two proposals a proponent can read are the
// ones checked.

const settle = { timeout: 30000 };

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

test("a published opportunity whose proposal deadline has passed closes on its own and moves to the first evaluation stage of its program", async ({
  surface,
}) => {
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

test("every proposal submitted against an opportunity whose proposal deadline has passed moves to review when it closes", async ({
  surface,
}) => {
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

// The notice is one message to one person, the author, so it arrives addressed to them. It is
// told from the author's other mail by naming the opportunity that closed, and looked for as
// present rather than counted: the closure may already have run before the test could take a
// count, since any request under /api sets it off.
test("the author of an opportunity whose proposal deadline has passed is notified that it is ready for evaluation when it closes", async ({
  surface,
  mail,
}) => {
  const author = seed.users.staffOne.email;
  await close(surface);

  const names = async (title: string): Promise<boolean> =>
    (await mail.messagesTo(author)).some((m) => `${m.Subject} ${m.Snippet}`.includes(title));

  await expect.poll(() => names(seed.opportunities.closedSprintWithUs.title), settle).toBe(true);
  await expect.poll(() => names(seed.opportunities.closedTeamWithUs.title), settle).toBe(true);
});
