// criterion: @R-2.17 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seeded qualified organization provides both of the service areas the seed names, so
// no opportunity built out of those names can call for one it lacks. The second test
// therefore builds an organization that is a qualified Team With Us supplier — approved for
// one service area, its program terms accepted — and has it bid on an opportunity calling
// for the other, which is the criterion's given with nothing else varying.
//
// Only an administrator may approve an organization for a service area, so the two halves
// of qualifying that organization are done by two different people.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const providedServiceArea = seed.organizations.qualified.service_areas[1];

const agileCoachOnly = {
  legalName: "R-2.17 Agile Coach Only Ltd.",
  streetAddress: "40 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Service Area Test Contact",
  contactTitle: "",
  contactEmail: "agile.coach.only@example.test",
  contactPhone: "",
  website: "",
};

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishTeamOpportunity(surface: Surface, title: string): Promise<void> {
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
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
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
}

test("a Team With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program", async ({
  surface,
}) => {
  const title = "R-2.17 opportunity bid on by an unqualified organization";
  await publishTeamOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalTwuCreate.open({ opportunity: title });
  await surface.proposalTwuCreate.chooseOrganization({
    organization: seed.organizations.unqualified,
  });
  expect(await surface.proposalTwuCreate.unqualifiedOrganizationNotice()).toBeTruthy();

  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: "Full Stack Developer",
    member: seed.users.vendorOne,
  });
  await surface.proposalTwuCreate.setHourlyRate({ resource: "Full Stack Developer", rate: 100 });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 0,
    response: "Our developer built and ran the same kind of service for a Crown corporation.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();

  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(title);
});

test("a Team With Us proposal is refused when its organization does not provide every service area the opportunity's resources call for", async ({
  surface,
}) => {
  const title = "R-2.17 opportunity calling for a service area the organization lacks";
  await publishTeamOpportunity(surface, title);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization(agileCoachOnly);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: agileCoachOnly.legalName });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [providedServiceArea] });
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: agileCoachOnly.legalName });
  await surface.organizationEdit.viewTwuTerms();
  await surface.organizationTwuTerms.acceptTerms();
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName: agileCoachOnly.legalName });
  expect(await surface.organizationEdit.twuQualifiedBadge()).toBeTruthy();

  await surface.proposalTwuCreate.open({ opportunity: title });
  await surface.proposalTwuCreate.chooseOrganization({
    organization: { legalName: agileCoachOnly.legalName },
  });
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: "Full Stack Developer",
    member: seed.users.organizationOwner,
  });
  await surface.proposalTwuCreate.setHourlyRate({ resource: "Full Stack Developer", rate: 100 });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 0,
    response: "Our coach has run this kind of engagement for two ministries.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();

  expect((await surface.proposalTwuCreate.serviceAreaError()).toLowerCase()).toContain(
    "service areas",
  );
});
