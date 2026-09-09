// criterion: @R-2.22 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion needs two organizations the same vendor may bid with, and the seed carries
// only one qualified supplier. A second one is built here: Team With Us qualification is an
// approved service area and the program's terms accepted, both of which the surface
// reaches, whereas Sprint With Us qualification also wants a team covering nine
// capabilities. So the proposal is a Team With Us one and the organization it is moved to
// provides the service area the opportunity calls for.
//
// The proposal management screens carry no action that names an organization, so the change
// is asked for through save_changes, which is the action that submits the edited proposal.
// A choose_organization action on proposal-twu-edit and proposal-swu-edit would say this
// outright; without one, the edit form is reached only through what save_changes carries.
//
// The refusal is read from the proposal still naming the organization it was submitted for,
// which is stronger than reading an error the management screen has no observation for.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

const secondSupplier = {
  legalName: "R-2.22 Second Supplier Ltd.",
  streetAddress: "60 Marine Way",
  addressLineTwo: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V1V1",
  country: "Canada",
  contactName: "Second Supplier Contact",
  contactTitle: "",
  contactEmail: "second.supplier@example.test",
  contactPhone: "",
  website: "",
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

async function qualifySecondSupplier(surface: Surface, legalName: string): Promise<void> {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization({ ...secondSupplier, legalName });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({
    serviceAreas: [seed.organizations.qualified.service_areas[0]],
  });
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await surface.organizationList.open();
  await surface.organizationList.openOrganization({ legalName });
  await surface.organizationEdit.viewTwuTerms();
  await surface.organizationTwuTerms.acceptTerms();
}

async function submitProposalForQualifiedOrganization(
  surface: Surface,
  opportunity: string,
): Promise<void> {
  await surface.proposalTwuCreate.open({ opportunity });
  await surface.proposalTwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: "Full Stack Developer",
    member: seed.users.organizationOwner,
  });
  await surface.proposalTwuCreate.setHourlyRate({ resource: "Full Stack Developer", rate: 100 });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 0,
    response: "Our developer built and ran the same kind of service for a Crown corporation.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();
}

test("once a proposal has been submitted, the organization it was submitted for cannot be changed", async ({
  surface,
}) => {
  const title = "R-2.22 opportunity whose submitted proposal tries to change organization";
  const legalName = "R-2.22 Second Supplier For A Submitted Proposal Ltd.";
  await publishTeamOpportunity(surface, title);
  await qualifySecondSupplier(surface, legalName);

  await submitProposalForQualifiedOrganization(surface, title);
  await surface.proposalTwuEdit.open({ opportunity: title });
  expect((await surface.proposalTwuEdit.status()).toLowerCase()).toContain("submitted");

  await surface.proposalTwuEdit.startEditing();
  await surface.proposalTwuEdit.saveChanges({ organization: { legalName } });

  await surface.proposalTwuEdit.open({ opportunity: title });
  const shown = await surface.proposalTwuEdit.proposalTab();
  expect(shown).toContain(seed.organizations.qualified.legal_name);
  expect(shown).not.toContain(legalName);
});

test("the organization may be changed once the proposal has been withdrawn", async ({
  surface,
}) => {
  const title = "R-2.22 opportunity whose withdrawn proposal changes organization";
  const legalName = "R-2.22 Second Supplier For A Withdrawn Proposal Ltd.";
  await publishTeamOpportunity(surface, title);
  await qualifySecondSupplier(surface, legalName);

  await submitProposalForQualifiedOrganization(surface, title);
  await surface.proposalTwuEdit.open({ opportunity: title });
  await surface.proposalTwuEdit.withdrawProposal();

  await surface.proposalTwuEdit.startEditing();
  await surface.proposalTwuEdit.saveChanges({ organization: { legalName } });

  await surface.proposalTwuEdit.open({ opportunity: title });
  expect(await surface.proposalTwuEdit.proposalTab()).toContain(legalName);
});
