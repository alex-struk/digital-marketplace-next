// criterion: @R-2.24 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The two vendors bid on two different opportunities rather than on one, because the
// dashboard lists a proposal by the opportunity it answers: two proposals against the same
// opportunity would read the same in both lists and neither list could be told from the
// other. Two opportunities give each list something the other must not have.
//
// The last test reads the refusal as the other vendor's proposal not being there to read.
// The proposal management screen names no refusal, so a proposal withheld and a proposal
// not found look the same from outside; what the criterion claims — that the vendor does
// not get to see it — is what the assertion covers.

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

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishOpportunity(surface: Surface, title: string): Promise<void> {
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
}

async function submitIndividualProposal(surface: Surface, opportunity: string): Promise<void> {
  await surface.proposalCwuCreate.open({ opportunity });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal offered by one vendor on their own account.",
  });
}

test("a vendor sees only the proposals they authored", async ({ surface }) => {
  const mine = "R-2.24 opportunity one vendor bids on";
  const theirs = "R-2.24 opportunity another vendor bids on";

  await surface.signIn(persona.administrator);
  await publishOpportunity(surface, mine);
  await publishOpportunity(surface, theirs);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await submitIndividualProposal(surface, mine);
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await submitIndividualProposal(surface, theirs);
  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).toContain(theirs);
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(mine);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).toContain(mine);
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(theirs);
});

test("a vendor additionally sees the proposals of organizations they own or administer, under a separate heading", async ({
  surface,
}) => {
  const title = "R-2.24 opportunity an organization bids on";

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    serviceArea: "Full Stack Developer",
    targetAllocation: 100,
    order: 0,
  });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
  await surface.opportunityTwuCreate.publish({
    teaser: details.teaser,
    location: details.location,
    description: details.description,
    remoteOk: details.remoteOk,
    remoteDescription: details.remoteDescription,
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    title,
  });
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.proposalTwuCreate.open({ opportunity: title });
  await surface.proposalTwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: "Full Stack Developer",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalTwuCreate.setHourlyRate({ resource: "Full Stack Developer", rate: 100 });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 0,
    response: "Our developer built and ran the same kind of service for a Crown corporation.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showOrgProposals();
  expect(await surface.proposalVendorDashboard.orgProposalsTable()).toContain(title);

  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(title);
});

test("a vendor never sees another vendor's proposal", async ({ surface }) => {
  const title = "R-2.24 opportunity whose proposal another vendor tries to open";

  await surface.signIn(persona.administrator);
  await publishOpportunity(surface, title);
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await submitIndividualProposal(surface, title);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.proposalCwuEdit.open({
    opportunity: title,
    author: seed.users.organizationAdmin.id,
  });
  expect(await surface.proposalCwuEdit.proposalTab()).toBeFalsy();

  await surface.proposalCwuView.open({
    opportunity: title,
    author: seed.users.organizationAdmin.id,
  });
  expect(await surface.proposalCwuView.proposalTab()).toBeFalsy();
});
