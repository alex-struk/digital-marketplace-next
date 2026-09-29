// criterion: @R-2.22 v1
// provenance: blind, spec@8272c1b989e3bad64c78ae540830a62747dadf42, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The organization rule must be the only thing under test, so the proposal is complete both
// before and after the organization is changed.
//
// Before. A submitted proposal is put to the service whole through proposal-team-request
// (sent as a submission), by users.organizationOwner for the seed's qualified organization,
// with that owner as the team and every question answered; the service's own answer says it
// was accepted and submitted before anything is changed. A draft is made on the proposal
// form with every part of it filled in, naming the same organization and team, and saved.
//
// The organization it is moved to is one the same proposal could stand for: a qualified
// supplier for the program, providing what the opportunity calls for, owned by
// users.organizationOwner so that the owner is one of its active members. For Team With Us it
// is approved by an administrator for the Full Stack Developer service area the opportunity
// calls for, its terms accepted; for Sprint With Us it is joined by users.organizationAdmin
// and users.organizationMember so that its three people hold every capability, its terms
// accepted.
//
// After. A team belongs to the organization it was chosen from, so changing the organization
// names the team again from the new organization's members — the owner, in the same place
// on the proposal — and every other part of the proposal is left as it was. The change is
// asked for from the proposal's management screen: start editing, choose the other
// organization, name the team again from it, save. The screen leaves the choice open on a
// submitted proposal, so the refusal is the service's: the form shows the service's own
// message against the organization, and the proposal still names the organization it was
// submitted for. On a draft or a withdrawn proposal the save goes through and the proposal
// names the new organization.

const statement =
  "Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn.";

const settle = { timeout: 30000 };
const cannotBeChanged = "Organization cannot be changed once the proposal has been submitted";
const submittedFor = seed.organizations.qualified;
const fullStack = "Full Stack Developer";
const answer = "Our team built and ran the same kind of service for a Crown corporation.";

type Program = "team-with-us" | "sprint-with-us";
type Organization = { id: string; legal_name: string; legalName: string };
type Where = { opportunityId: string; proposalId: string };

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

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

const details = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

const references = [0, 1, 2].map((order) => ({
  order,
  name: `Reference ${order + 1}`,
  company: "Reference Company Ltd.",
  phone: "250-555-0101",
  email: `reference.${order + 1}@example.test`,
}));

// The team each program's proposal names, from whichever organization it is for: the owner,
// who is an active member of both organizations these tests use.
const teamWithUsTeam = [{ member: seed.users.organizationOwner, resource: fullStack, hourlyRate: 100 }];
const sprintWithUsPhases = [
  {
    phase: "Implementation",
    members: [{ member: seed.users.organizationOwner, scrumMaster: true }],
    proposedCost: 400000,
  },
];

async function publishTeamOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({ serviceArea: fullStack, targetAllocation: 100, order: 0 });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
  await surface.opportunityTwuCreate.publish({
    ...details,
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    title,
  });
  await expect.poll(() => readOrEmpty(() => surface.opportunityTwuEdit.opportunityIdentifier()), settle).toBeTruthy();
  const opportunityId = await surface.opportunityTwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

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
    ...details,
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

async function registerOrganization(surface: Surface, legalName: string): Promise<Organization> {
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
    contactName: "Second Supplier Contact",
    contactTitle: "",
    contactEmail: "second.supplier@example.test",
    contactPhone: "",
    website: "",
  });
  await expect.poll(() => readOrEmpty(() => surface.organizationEdit.organizationIdentifier()), settle).toBeTruthy();
  const id = await surface.organizationEdit.organizationIdentifier();
  return { id, legal_name: legalName, legalName };
}

async function secondTeamWithUsSupplier(surface: Surface, legalName: string): Promise<Organization> {
  const organization = await registerOrganization(surface, legalName);

  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [submittedFor.service_areas[0]] });

  await surface.signIn(persona.organizationOwner);
  await surface.organizationTwuTerms.open({ orgId: organization.id });
  await surface.organizationTwuTerms.acceptTerms();
  return organization;
}

async function secondSprintWithUsSupplier(surface: Surface, legalName: string): Promise<Organization> {
  const organization = await registerOrganization(surface, legalName);

  await surface.organizationEdit.open({ orgId: organization.id });
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

async function submittedThroughTheService(surface: Surface): Promise<string> {
  await expect
    .poll(
      async () =>
        (await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted())) ||
        (await readOrEmpty(() => surface.proposalTeamRequest.refusalStatus())),
      { ...settle, message: "the service answered the submission" },
    )
    .toBeTruthy();
  expect(await readOrEmpty(() => surface.proposalTeamRequest.refusalMessages()), "the proposal was refused").toBe("");
  expect(await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted())).toBeTruthy();
  expect(await readOrEmpty(() => surface.proposalTeamRequest.proposalStatus())).toMatch(/submitted/i);
  return surface.proposalTeamRequest.proposalIdentifier();
}

async function submitTeamWithUs(surface: Surface, opportunityId: string): Promise<string> {
  await surface.signIn(persona.organizationOwner);
  await surface.proposalTeamRequest.open({ program: "team-with-us" });
  await surface.proposalTeamRequest.submitTeamProposal({
    opportunityId,
    organization: submittedFor,
    team: teamWithUsTeam,
    answers: [{ order: 0, response: answer }],
  });
  return submittedThroughTheService(surface);
}

async function submitSprintWithUs(surface: Surface, opportunityId: string): Promise<string> {
  await surface.signIn(persona.organizationOwner);
  await surface.proposalTeamRequest.open({ program: "sprint-with-us" });
  await surface.proposalTeamRequest.submitTeamProposal({
    opportunityId,
    organization: submittedFor,
    phases: sprintWithUsPhases,
    answers: [{ order: 0, response: answer }],
    references,
  });
  return submittedThroughTheService(surface);
}

async function draftTeamWithUs(surface: Surface, opportunityId: string): Promise<Where> {
  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuCreate.open({ opportunityId });
  await surface.proposalTwuCreate.chooseOrganization({ organization: submittedFor });
  await surface.proposalTwuCreate.addTeamMemberForResource({ resource: fullStack, member: seed.users.organizationOwner });
  await surface.proposalTwuCreate.setHourlyRate({ resource: fullStack, rate: 100 });
  await surface.proposalTwuCreate.answerResourceQuestion({ order: 0, response: answer });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.saveDraft();
  await expect.poll(() => readOrEmpty(() => surface.proposalTwuEdit.proposalIdentifier()), settle).toBeTruthy();
  const where = { opportunityId, proposalId: await surface.proposalTwuEdit.proposalIdentifier() };
  await expect.poll(() => readOrEmpty(() => surface.proposalTwuEdit.status()), settle).toMatch(/draft/i);
  return where;
}

async function draftSprintWithUs(surface: Surface, opportunityId: string): Promise<Where> {
  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuCreate.open({ opportunityId });
  await surface.proposalSwuCreate.chooseOrganization({ organization: submittedFor });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "Implementation", member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.setScrumMaster({ phase: "Implementation", member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
  await surface.proposalSwuCreate.answerTeamQuestion({ order: 0, response: answer });
  for (const reference of references) await surface.proposalSwuCreate.addReference(reference);
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
  await surface.proposalSwuCreate.saveDraft();
  await expect.poll(() => readOrEmpty(() => surface.proposalSwuEdit.proposalIdentifier()), settle).toBeTruthy();
  const where = { opportunityId, proposalId: await surface.proposalSwuEdit.proposalIdentifier() };
  await expect.poll(() => readOrEmpty(() => surface.proposalSwuEdit.status()), settle).toMatch(/draft/i);
  return where;
}

function managementScreen(surface: Surface, program: Program) {
  return program === "team-with-us" ? surface.proposalTwuEdit : surface.proposalSwuEdit;
}

// Chooses the other organization and, from its members, names the team again; nothing else
// changes.
async function changeOrganization(surface: Surface, program: Program, where: Where, organization: Organization): Promise<void> {
  if (program === "team-with-us") {
    const edit = surface.proposalTwuEdit;
    await edit.open(where);
    await edit.startEditing();
    await edit.chooseOrganization({ organization });
    await edit.addTeamMemberForResource({ resource: fullStack, member: seed.users.organizationOwner });
    await edit.saveChanges();
  } else {
    const edit = surface.proposalSwuEdit;
    await edit.open(where);
    await edit.startEditing();
    await edit.chooseOrganization({ organization });
    await edit.addPhaseTeamMember({ phase: "Implementation", member: seed.users.organizationOwner });
    await edit.setScrumMaster({ phase: "Implementation", member: seed.users.organizationOwner });
    await edit.saveChanges();
  }
}

async function namedOrganization(surface: Surface, program: Program, where: Where): Promise<string> {
  const edit = managementScreen(surface, program);
  await edit.open(where);
  return readOrEmpty(() => edit.organization());
}

async function withdraw(surface: Surface, program: Program, where: Where): Promise<void> {
  const edit = managementScreen(surface, program);
  await edit.open(where);
  await edit.withdrawProposal();
  await expect.poll(() => readOrEmpty(() => edit.status()), settle).toMatch(/withdrawn/i);
}

async function expectRefusedAndStillSubmittedFor(
  surface: Surface,
  program: Program,
  where: Where,
  other: Organization,
): Promise<void> {
  const edit = managementScreen(surface, program);
  await expect
    .poll(() => readOrEmpty(() => edit.fieldError()), { ...settle, message: "the change was not refused with the service's reason" })
    .toContain(cannotBeChanged);

  await expect.poll(() => namedOrganization(surface, program, where), settle).toContain(submittedFor.legal_name);
  expect(
    await namedOrganization(surface, program, where),
    "the organization of a submitted proposal was changed",
  ).not.toContain(other.legalName);
}

async function expectNowFor(surface: Surface, program: Program, where: Where, other: Organization): Promise<void> {
  await expect
    .poll(() => namedOrganization(surface, program, where), { ...settle, message: "the organization was not changed" })
    .toContain(other.legalName);
}

test(`${statement} (changing a submitted Team With Us proposal's organization is refused, and it keeps the organization it was submitted for)`, async ({ surface }) => {
  test.setTimeout(300000);
  const other = await secondTeamWithUsSupplier(surface, "R-2.22 Second Supplier For A Submitted Proposal Ltd.");
  const opportunityId = await publishTeamOpportunity(surface, "R-2.22 opportunity whose submitted proposal is moved");
  const where = { opportunityId, proposalId: await submitTeamWithUs(surface, opportunityId) };

  await changeOrganization(surface, "team-with-us", where, other);

  await expectRefusedAndStillSubmittedFor(surface, "team-with-us", where, other);
});

test(`${statement} (a withdrawn Team With Us proposal may be moved to another organization)`, async ({ surface }) => {
  test.setTimeout(300000);
  const other = await secondTeamWithUsSupplier(surface, "R-2.22 Second Supplier For A Withdrawn Proposal Ltd.");
  const opportunityId = await publishTeamOpportunity(surface, "R-2.22 opportunity whose withdrawn proposal is moved");
  const where = { opportunityId, proposalId: await submitTeamWithUs(surface, opportunityId) };
  await withdraw(surface, "team-with-us", where);

  await changeOrganization(surface, "team-with-us", where, other);

  await expectNowFor(surface, "team-with-us", where, other);
});

test(`${statement} (a draft Team With Us proposal may be moved to another organization)`, async ({ surface }) => {
  test.setTimeout(300000);
  const other = await secondTeamWithUsSupplier(surface, "R-2.22 Second Supplier For A Draft Proposal Ltd.");
  const opportunityId = await publishTeamOpportunity(surface, "R-2.22 opportunity whose draft proposal is moved");
  const where = await draftTeamWithUs(surface, opportunityId);

  await changeOrganization(surface, "team-with-us", where, other);

  await expectNowFor(surface, "team-with-us", where, other);
});

test(`${statement} (changing a submitted Sprint With Us proposal's organization is refused, and it keeps the organization it was submitted for)`, async ({ surface }) => {
  test.setTimeout(360000);
  const other = await secondSprintWithUsSupplier(surface, "R-2.22 Second Sprint Supplier For A Submitted Proposal Ltd.");
  const opportunityId = await publishSprintOpportunity(surface, "R-2.22 opportunity whose submitted sprint proposal is moved");
  const where = { opportunityId, proposalId: await submitSprintWithUs(surface, opportunityId) };

  await changeOrganization(surface, "sprint-with-us", where, other);

  await expectRefusedAndStillSubmittedFor(surface, "sprint-with-us", where, other);
});

test(`${statement} (a withdrawn Sprint With Us proposal may be moved to another organization)`, async ({ surface }) => {
  test.setTimeout(360000);
  const other = await secondSprintWithUsSupplier(surface, "R-2.22 Second Sprint Supplier For A Withdrawn Proposal Ltd.");
  const opportunityId = await publishSprintOpportunity(surface, "R-2.22 opportunity whose withdrawn sprint proposal is moved");
  const where = { opportunityId, proposalId: await submitSprintWithUs(surface, opportunityId) };
  await withdraw(surface, "sprint-with-us", where);

  await changeOrganization(surface, "sprint-with-us", where, other);

  await expectNowFor(surface, "sprint-with-us", where, other);
});

test(`${statement} (a draft Sprint With Us proposal may be moved to another organization)`, async ({ surface }) => {
  test.setTimeout(360000);
  const other = await secondSprintWithUsSupplier(surface, "R-2.22 Second Sprint Supplier For A Draft Proposal Ltd.");
  const opportunityId = await publishSprintOpportunity(surface, "R-2.22 opportunity whose draft sprint proposal is moved");
  const where = await draftSprintWithUs(surface, opportunityId);

  await changeOrganization(surface, "sprint-with-us", where, other);

  await expectNowFor(surface, "sprint-with-us", where, other);
});
