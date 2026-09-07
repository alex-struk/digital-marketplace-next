// criterion: @R-2.5 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const SERVICE_AREA = seed.organizations.qualified.service_areas[0];
const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";

async function publishOpportunity(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    order: 1,
    serviceArea: SERVICE_AREA,
    targetAllocation: 100,
  });
  await surface.opportunityTwuCreate.addResourceQuestion({
    order: 1,
    question: "How would you staff this work?",
    wordLimit: 300,
    minimumScore: 1,
    score: 100,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel({
    members: [persona.evaluationPanelEvaluator, persona.evaluationPanelChair],
    chair: persona.evaluationPanelChair,
  });
  await surface.opportunityTwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    maxBudget: 200000,
    startDate: "2030-07-01",
    completionDate: "2030-12-31",
    proposalDeadline: FUTURE_DEADLINE,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
  });
}

// A qualified supplier for Team With Us is an active organization that has accepted the
// program's terms and provides the service area the opportunity's resource calls for.
async function qualifyForTeamWithUs(surface: Surface, organization: Record<string, string>) {
  await surface.organizationEdit.open(organization);
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [SERVICE_AREA] });
  await surface.organizationEdit.viewTwuTerms();
  await surface.organizationTwuTerms.acceptTerms();
}

async function registerOrganization(
  surface: Surface,
  legalName: string,
  contactName: string,
  contactEmail: string
) {
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization({
    legalName,
    streetAddress1: "3 Harbour Road",
    city: "Nanaimo",
    region: "British Columbia",
    mailCode: "V9R 5J8",
    country: "Canada",
    contactName,
    contactEmail,
  });
}

async function submitProposal(
  surface: Surface,
  title: string,
  organization: unknown,
  member: unknown,
  hourlyRate: number
) {
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization(organization);
  await surface.proposalTwuCreate.addTeamMemberForResource({ resource: 1, member });
  await surface.proposalTwuCreate.setHourlyRate({ resource: 1, member, hourlyRate });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 1,
    response: "We would staff it with the people named above.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();
}

// Three submitted proposals from three different organizations — an organization may
// appear on only one proposal per opportunity — and one draft alongside them.
async function opportunityWithThreeSubmittedAndOneDraft(
  surface: Surface,
  title: string,
  secondOrganization: string,
  thirdOrganization: string
) {
  await publishOpportunity(surface, title);

  await surface.signIn(persona.organizationOwner);
  await submitProposal(surface, title, seed.organizations.qualified, seed.users.organizationOwner, 50);

  // The other two bidders bring organizations of their own, registered and qualified for
  // this test alone, because an organization may appear on only one proposal apiece.
  await surface.signIn(persona.vendor);
  await registerOrganization(surface, secondOrganization, "Casey Cedar", "casey.cedar@example.test");
  await qualifyForTeamWithUs(surface, { organizationName: secondOrganization });
  await submitProposal(surface, title, { legalName: secondOrganization }, seed.users.vendorOne, 60);

  await surface.signIn(persona.fileUploader);
  await registerOrganization(surface, thirdOrganization, "Sam Harbour", "sam.harbour@example.test");
  await qualifyForTeamWithUs(surface, { organizationName: thirdOrganization });
  await submitProposal(surface, title, { legalName: thirdOrganization }, seed.users.fileUploader, 70);

  // The fourth vendor leaves theirs in draft; a draft may be as incomplete as it likes.
  await surface.signIn(persona.organizationMember);
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.saveDraft({ note: "Still working on this." });

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuEdit.open({ opportunityTitle: title });
  await surface.opportunityTwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();
}

test("when an opportunity closes, every proposal submitted against it moves to the first review stage of that program and is given an anonymous proponent name numbered from one", async ({
  surface,
}) => {
  const title = "R-2.5 closing names the proponents";
  await opportunityWithThreeSubmittedAndOneDraft(
    surface,
    title,
    "R-2.5 Second Naming Ltd.",
    "R-2.5 Third Naming Ltd."
  );

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuView.open({ opportunityTitle: title });
  expect(await surface.opportunityTwuView.status()).toContain("Closed");

  const names: string[] = [];
  for (const bidder of [persona.organizationOwner, persona.vendor, persona.fileUploader]) {
    await surface.signIn(bidder);
    await surface.proposalTwuEdit.open({ opportunityTitle: title });
    expect(await surface.proposalTwuEdit.status()).toContain("Questions");
    names.push(await surface.proposalTwuEdit.anonymousProponentName());
  }

  expect(names.sort()).toEqual(["Proponent 1", "Proponent 2", "Proponent 3"]);
});

test("when an opportunity closes, a proposal still in draft against it is left alone", async ({
  surface,
}) => {
  const title = "R-2.5 closing leaves the draft alone";
  await opportunityWithThreeSubmittedAndOneDraft(
    surface,
    title,
    "R-2.5 Second Bystander Ltd.",
    "R-2.5 Third Bystander Ltd."
  );

  await surface.signIn(persona.organizationMember);
  await surface.proposalTwuEdit.open({ opportunityTitle: title });

  expect(await surface.proposalTwuEdit.status()).toContain("Draft");
  expect(await surface.proposalTwuEdit.anonymousProponentName()).toBeFalsy();
});
