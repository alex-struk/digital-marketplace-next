// criterion: @R-2.16 v1
// provenance: blind, spec@8272c1b989e3bad64c78ae540830a62747dadf42, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The first test builds the criterion's given as it states it: a draft saved while its
// organization is a qualified supplier for Sprint With Us, which then stops being one before
// the vendor submits. The organization is registered by users.organizationOwner and joined
// by users.organizationAdmin and users.organizationMember, so that its three active people
// hold every capability between them, and its Sprint With Us terms are accepted. The draft
// names that organization and a team the proposal can name from it — the owner, an active
// member who holds the capability the phase asks for, as team member and scrum master —
// with every other part of the proposal filled in. Then users.organizationMember leaves the
// organization, taking three of the capabilities with it, and the vendor submits the draft.
// What is read is that the draft did not become submitted.
//
// The second test is the proposal naming no organization at all. With no organization
// chosen the form has no team to offer, and the form withholding the submission is itself
// the refusal, so what is read is that no proposal was submitted. The message the criterion
// quotes is the service's, and no surface sends it a Sprint With Us submission without an
// organization; see this criterion's entry in not-testable.yaml.

const settle = { timeout: 30000 };

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function attempt(action: () => Promise<void>): Promise<void> {
  await action().catch(() => undefined);
}

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishSprintOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 500000,
    capabilities: ["Backend Development"],
  });
  await surface.opportunitySwuCreate.addTeamQuestion({
    question: "Describe how your team has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel(panel);
  await surface.opportunitySwuCreate.publish({
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
    title,
  });
  await expect.poll(() => readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

type Organization = { id: string; legal_name: string; legalName: string };

async function qualifiedSprintSupplier(surface: Surface, legalName: string): Promise<Organization> {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationCreate.open();
  await surface.organizationCreate.createOrganization({
    legalName,
    streetAddress: "60 Marine Way",
    addressLineTwo: "",
    city: "Victoria",
    region: "British Columbia",
    mailCode: "V8V1V1",
    country: "Canada",
    contactName: "Supplier Contact",
    contactTitle: "",
    contactEmail: "supplier.contact@example.test",
    contactPhone: "",
    website: "",
  });
  await expect.poll(() => readOrEmpty(() => surface.organizationEdit.organizationIdentifier()), settle).toBeTruthy();
  const organization = { id: await surface.organizationEdit.organizationIdentifier(), legal_name: legalName, legalName };

  await surface.organizationEdit.addTeamMembers({
    emails: [seed.users.organizationAdmin.email, seed.users.organizationMember.email],
  });
  for (const who of [persona.organizationAdmin, persona.organizationMember]) {
    await surface.signIn(who);
    await surface.organizationUserMembershipsSelf.open();
    await surface.organizationUserMembershipsSelf.approveInvitation({ organization: legalName });
  }

  await surface.signIn(persona.organizationOwner);
  await surface.organizationSwuTerms.open({ orgId: organization.id });
  await surface.organizationSwuTerms.acceptTerms();
  return organization;
}

async function answerReferencesAndTerms(surface: Surface): Promise<void> {
  await surface.proposalSwuCreate.answerTeamQuestion({
    order: 0,
    response: "We delivered a scheduling service for a health authority over eighteen months.",
  });
  for (const order of [0, 1, 2]) {
    await surface.proposalSwuCreate.addReference({
      order,
      name: `Reference ${order + 1}`,
      company: "Reference Company Ltd.",
      phone: "250-555-0101",
      email: `reference.${order + 1}@example.test`,
    });
  }
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
}

test("A Sprint With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program, and the organization is re-checked at the moment of submission.", async ({
  surface,
}) => {
  test.setTimeout(300000);
  const organization = await qualifiedSprintSupplier(surface, "R-2.16 Supplier That Loses Its Qualification Ltd.");
  const opportunityId = await publishSprintOpportunity(surface, "R-2.16 opportunity bid on by a supplier that stops qualifying");

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuCreate.open({ opportunityId });
  await surface.proposalSwuCreate.chooseOrganization({ organization });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "Implementation", member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.setScrumMaster({ phase: "Implementation", member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
  await answerReferencesAndTerms(surface);
  await surface.proposalSwuCreate.saveDraft();
  await expect.poll(() => readOrEmpty(() => surface.proposalSwuEdit.proposalIdentifier()), settle).toBeTruthy();
  const where = { opportunityId, proposalId: await surface.proposalSwuEdit.proposalIdentifier() };

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMembershipsSelf.open();
  await surface.organizationUserMembershipsSelf.leaveOrganization({ organization: organization.legalName });

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuEdit.open(where);
  await attempt(() => surface.proposalSwuEdit.submitProposal());

  await surface.proposalSwuEdit.open(where);
  expect(
    await readOrEmpty(() => surface.proposalSwuEdit.status()),
    "a proposal for an organization that no longer qualifies was submitted",
  ).not.toMatch(/submitted/i);
});

test("A Sprint With Us proposal naming no organization at all is refused.", async ({ surface }) => {
  const title = "R-2.16 opportunity bid on with no organization named";
  const opportunityId = await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuCreate.open({ opportunityId });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
  await answerReferencesAndTerms(surface);
  await attempt(() => surface.proposalSwuCreate.submitProposal());

  await surface.proposalVendorDashboard.open();
  await attempt(() => surface.proposalVendorDashboard.showMyProposals());
  expect(
    await readOrEmpty(() => surface.proposalVendorDashboard.myProposalsTable()),
    "a proposal naming no organization was submitted",
  ).not.toContain(title);
});
