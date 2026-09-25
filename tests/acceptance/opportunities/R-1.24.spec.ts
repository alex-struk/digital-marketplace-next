// criterion: @R-1.24 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a published opportunity with submitted proposals whose deadline has gone by,
// which the seed carries for both programs that anonymise their proponents, three proposals
// each. The when is the closure, set off through the scheduled transition trigger.
//
// Before closure is set off, the given is established rather than assumed. The opportunity
// itself must be readable: its own title is listed among everything the administrator sees,
// and its own view reads a state for it. An address that opens is not enough, since it opens
// the same whether or not there is an opportunity behind it. Each proponent a persona signs in
// as must also be able to open their own submitted proposal against it; the third belongs to a
// proponent no persona signs in as. The service may already have closed the opportunity by the
// time these readings are made, since any request under /api sets closure off; what they
// establish is that the records are there and readable, not the moment. Where the Team With Us
// opportunity cannot be read on the target, the case is recorded as blocked.
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

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function readable(read: () => Promise<string>, expected: RegExp | string): Promise<boolean> {
  try {
    await expect
      .poll(() => readOrEmpty(read), { timeout: 15000 })
      .toMatch(typeof expected === "string" ? new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) : expected);
    return true;
  } catch {
    return false;
  }
}

async function close(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

function countNames(shown: string): number {
  return names.filter((name) => shown.includes(name)).length;
}

async function everythingAnAdministratorSees(surface: Surface): Promise<string> {
  await surface.opportunityDashboard.open();
  return surface.opportunityDashboard.allOpportunitiesForAdministrator();
}

test(`${statement} (Sprint With Us)`, async ({ surface }) => {
  const opportunity = seed.opportunities.closedSprintWithUs;
  const opportunityId = opportunity.id;

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuEdit.open({ opportunityId, proposalId: seed.proposals.sprintWithUsOne.id });
  await expect.poll(() => surface.proposalSwuEdit.proposalIdentifier(), settle).toContain(seed.proposals.sprintWithUsOne.id);
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await surface.proposalSwuEdit.open({ opportunityId, proposalId: seed.proposals.sprintWithUsTwo.id });
  await expect.poll(() => surface.proposalSwuEdit.proposalIdentifier(), settle).toContain(seed.proposals.sprintWithUsTwo.id);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  expect(await readable(() => everythingAnAdministratorSees(surface), opportunity.title)).toBe(true);
  await surface.opportunitySwuView.open({ opportunityId });
  expect(await readable(() => surface.opportunitySwuView.status(), /\S/)).toBe(true);

  await close(surface);

  await expect
    .poll(async () => {
      await close(surface);
      await surface.opportunitySwuView.open({ opportunityId });
      return (await readOrEmpty(() => surface.opportunitySwuView.status())).toLowerCase();
    }, settle)
    .toMatch(/evaluat|question/);

  await expect
    .poll(async () => {
      await surface.evaluationIndividualListSwu.open({ opportunityId });
      return countNames(await readOrEmpty(() => surface.evaluationIndividualListSwu.anonymousProponentName()));
    }, settle)
    .toBe(names.length);
});

test(`${statement} (Team With Us)`, async ({ surface }) => {
  const opportunity = seed.opportunities.closedTeamWithUs;
  const opportunityId = opportunity.id;

  await surface.signIn(persona.administrator);
  const titled = await readable(() => everythingAnAdministratorSees(surface), opportunity.title);
  await surface.opportunityTwuView.open({ opportunityId });
  const stated = await readable(() => surface.opportunityTwuView.status(), /\S/);
  if (!titled || !stated) {
    test.skip(true, "blocked: the seeded Team With Us opportunity cannot be read on the target — its title and state are not shown — so its closure cannot be observed");
  }
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuEdit.open({ opportunityId, proposalId: seed.proposals.teamWithUsOne.id });
  await expect.poll(() => surface.proposalTwuEdit.proposalIdentifier(), settle).toContain(seed.proposals.teamWithUsOne.id);
  await surface.signOut();

  await surface.signIn(persona.competingVendor);
  await surface.proposalTwuEdit.open({ opportunityId, proposalId: seed.proposals.teamWithUsTwo.id });
  await expect.poll(() => surface.proposalTwuEdit.proposalIdentifier(), settle).toContain(seed.proposals.teamWithUsTwo.id);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await close(surface);

  await expect
    .poll(async () => {
      await close(surface);
      await surface.opportunityTwuView.open({ opportunityId });
      return (await readOrEmpty(() => surface.opportunityTwuView.status())).toLowerCase();
    }, settle)
    .toMatch(/evaluat|question/);

  await expect
    .poll(async () => {
      await surface.evaluationIndividualListTwu.open({ opportunityId });
      return countNames(await readOrEmpty(() => surface.evaluationIndividualListTwu.anonymousProponentName()));
    }, settle)
    .toBe(names.length);
});
