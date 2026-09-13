// criterion: @R-2.25 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The first test's opportunity is written by a member of public sector staff and published
// by an administrator, so that both readers the criterion names are on it: its own author
// and an administrator. It carries one submitted proposal and one draft, from two different
// vendors, which is the given.
//
// The second test is the other side of the same line, and it needs an opportunity that has
// closed. That cannot be built through a form, so it is the seeded Sprint With Us
// opportunity — published with a deadline thirty days old — and the service's own deadline
// hook, asked for through run_pending_transitions, is what closes it. Its author is the
// staff member the seed names, and the proposals that appear are the three it carries.
//
// "Never drafts or unsubmitted proposals" is only asserted before the closure, where the
// draft is withheld along with everything else. The seeded closed opportunity carries
// submitted proposals only, and no draft can be added to one: every vendor who could bid on
// it has bid, and every qualified organization is already named on a proposal of its own. A
// seeded draft against a closed opportunity would close the gap.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const details = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(35),
};

async function closeOverdueOpportunities(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

test("public sector staff and administrators cannot see any proposal against an opportunity until that opportunity has closed", async ({
  surface,
}) => {
  const title = "R-2.25 opportunity whose proposals are withheld while it is open";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...details, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.opportunityCwuEdit.submitForReview();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A submitted proposal the opportunity's author may not yet read.",
  });
  const submitted = await surface.proposalCwuEdit.proposalIdentifier();
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({
    proposalText: "A draft proposal the opportunity's author may never read.",
  });
  const draft = await surface.proposalCwuEdit.proposalIdentifier();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.proposalsTab()).toBeFalsy();
  await surface.proposalCwuView.open({ opportunityId, proposalId: submitted });
  expect(await surface.proposalCwuView.proposalTab()).toBeFalsy();
  await surface.proposalCwuView.open({ opportunityId, proposalId: draft });
  expect(await surface.proposalCwuView.proposalTab()).toBeFalsy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.proposalsTab()).toBeFalsy();
  await surface.proposalCwuView.open({ opportunityId, proposalId: submitted });
  expect(await surface.proposalCwuView.proposalTab()).toBeFalsy();
  await surface.proposalCwuView.open({ opportunityId, proposalId: draft });
  expect(await surface.proposalCwuView.proposalTab()).toBeFalsy();
});

test("once the opportunity has closed, its submitted proposals are shown to the opportunity's author and to an administrator", async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  const opportunityId = seed.opportunities.closedSprintWithUs.id;
  const proposalId = seed.proposals.sprintWithUsOne.id;

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuEdit.open({ opportunityId });
  expect(await surface.opportunitySwuEdit.proposalsTab()).toBeTruthy();
  await surface.proposalSwuView.open({ opportunityId, proposalId });
  expect(await surface.proposalSwuView.proposalTab()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ opportunityId });
  expect(await surface.opportunitySwuEdit.proposalsTab()).toBeTruthy();
  await surface.proposalSwuView.open({ opportunityId, proposalId });
  expect(await surface.proposalSwuView.proposalTab()).toBeTruthy();
});
