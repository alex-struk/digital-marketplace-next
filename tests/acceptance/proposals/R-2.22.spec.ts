// criterion: @R-2.22 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The organization change must be the only thing under test, so the proposal it is made on is
// complete in every other respect, and so is the organization it is moved to.
//
// The proposal. A submitted proposal is put to the service whole through proposal-team-request
// (sent as a submission), by users.organizationOwner for the seed's qualified organization, with
// that owner as the one team member and every question answered; the service's own answer says
// it was accepted and submitted before anything is changed. The draft is made on the Team With
// Us form with every part of it filled in and then saved as a draft.
//
// The organization it is moved to. It has to be one the same proposal could stand for: a
// qualified supplier for the program, providing what the opportunity calls for, with the team
// member an active member of it. The seed holds no second such organization for the same
// vendor, so the test builds one that users.organizationOwner owns: for Team With Us, approved
// by an administrator for the Full Stack Developer service area the opportunity calls for, its
// program terms accepted; for Sprint With Us, joined by the qualified organization's other two
// people so that its three people hold every capability, its program terms accepted.
//
// The change is asked for from the proposal's management screen: start editing, name the other
// organization, save. Whether it took is read from the proposal itself, which names its
// organization. A refused change the screen does not even offer to make is still a refusal, so
// a save that cannot be made is not a failure of the refused case; what is asserted there is
// that the proposal still names the organization it was submitted for.
//
// The message the criterion quotes is not asserted: no observation on either management screen
// reports why a save was refused. See this criterion's entry in not-testable.yaml.

const statement =
  "Once a proposal has been submitted, the organization it was submitted for cannot be changed until it is withdrawn.";

const settle = { timeout: 30000 };
const submittedFor = seed.organizations.qualified;
const fullStack = "Full Stack Developer";
const answer = "Our team built and ran the same kind of service for a Crown corporation.";

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

type Organization = { id: string; legal_name: string; legalName: string };

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
    team: [{ member: seed.users.organizationOwner, resource: fullStack, hourlyRate: 100 }],
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
    phases: [
      {
        phase: "Implementation",
        members: [{ member: seed.users.organizationOwner, scrumMaster: true }],
        proposedCost: 400000,
      },
    ],
    answers: [{ order: 0, response: answer }],
    references: [0, 1, 2].map((order) => ({
      order,
      name: `Reference ${order + 1}`,
      company: "Reference Company Ltd.",
      phone: "250-555-0101",
      email: `reference.${order + 1}@example.test`,
    })),
  });
  return submittedThroughTheService(surface);
}

type ManagementScreen = Surface["proposalTwuEdit"] | Surface["proposalSwuEdit"];

function managementScreen(surface: Surface, program: "team-with-us" | "sprint-with-us"): ManagementScreen {
  return program === "team-with-us" ? surface.proposalTwuEdit : surface.proposalSwuEdit;
}

async function changeOrganization(
  surface: Surface,
  program: "team-with-us" | "sprint-with-us",
  where: { opportunityId: string; proposalId: string },
  organization: Organization,
): Promise<void> {
  const edit = managementScreen(surface, program);
  await edit.open(where);
  await edit.startEditing();
  await edit.saveChanges({ organization });
}

async function namedOrganization(
  surface: Surface,
  program: "team-with-us" | "sprint-with-us",
  where: { opportunityId: string; proposalId: string },
): Promise<string> {
  const edit = managementScreen(surface, program);
  await edit.open(where);
  return readOrEmpty(() => edit.proposalTab());
}

async function expectStillSubmittedFor(
  surface: Surface,
  program: "team-with-us" | "sprint-with-us",
  where: { opportunityId: string; proposalId: string },
  other: Organization,
): Promise<void> {
  await expect
    .poll(() => namedOrganization(surface, program, where), settle)
    .toContain(submittedFor.legal_name);
  expect(await namedOrganization(surface, program, where), "the organization of a submitted proposal was changed").not.toContain(
    other.legalName,
  );
}

async function expectNowFor(
  surface: Surface,
  program: "team-with-us" | "sprint-with-us",
  where: { opportunityId: string; proposalId: string },
  other: Organization,
): Promise<void> {
  await expect
    .poll(() => namedOrganization(surface, program, where), { ...settle, message: "the organization was not changed" })
    .toContain(other.legalName);
}

test(`${statement} (a submitted Team With Us proposal keeps the organization it was submitted for)`, async ({
  surface,
}) => {
  test.setTimeout(300000);
  const other = await secondTeamWithUsSupplier(surface, "R-2.22 Second Supplier For A Submitted Proposal Ltd.");
  const opportunityId = await publishTeamOpportunity(surface, "R-2.22 opportunity whose submitted proposal is moved");
  const proposalId = await submitTeamWithUs(surface, opportunityId);
  const where = { opportunityId, proposalId };

  await attempt(() => changeOrganization(surface, "team-with-us", where, other));

  await expectStillSubmittedFor(surface, "team-with-us", where, other);
});

test(`${statement} (a withdrawn Team With Us proposal may be moved to another organization)`, async ({ surface }) => {
  test.setTimeout(300000);
  const other = await secondTeamWithUsSupplier(surface, "R-2.22 Second Supplier For A Withdrawn Proposal Ltd.");
  const opportunityId = await publishTeamOpportunity(surface, "R-2.22 opportunity whose withdrawn proposal is moved");
  const proposalId = await submitTeamWithUs(surface, opportunityId);
  const where = { opportunityId, proposalId };

  await surface.proposalTwuEdit.open(where);
  await surface.proposalTwuEdit.withdrawProposal();
  await expect.poll(() => readOrEmpty(() => surface.proposalTwuEdit.status()), settle).toMatch(/withdrawn/i);

  await changeOrganization(surface, "team-with-us", where, other);

  await expectNowFor(surface, "team-with-us", where, other);
});

test(`${statement} (a draft Team With Us proposal may be moved to another organization)`, async ({ surface }) => {
  test.setTimeout(300000);
  const other = await secondTeamWithUsSupplier(surface, "R-2.22 Second Supplier For A Draft Proposal Ltd.");
  const opportunityId = await publishTeamOpportunity(surface, "R-2.22 opportunity whose draft proposal is moved");

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuCreate.open({ opportunityId });
  await surface.proposalTwuCreate.chooseOrganization({ organization: submittedFor });
  await surface.proposalTwuCreate.addTeamMemberForResource({ resource: fullStack, member: seed.users.organizationOwner });
  await surface.proposalTwuCreate.setHourlyRate({ resource: fullStack, rate: 100 });
  await surface.proposalTwuCreate.answerResourceQuestion({ order: 0, response: answer });
  await surface.proposalTwuCreate.saveDraft();
  await expect.poll(() => readOrEmpty(() => surface.proposalTwuEdit.proposalIdentifier()), settle).toBeTruthy();
  const where = { opportunityId, proposalId: await surface.proposalTwuEdit.proposalIdentifier() };
  await expect.poll(() => readOrEmpty(() => surface.proposalTwuEdit.status()), settle).toMatch(/draft/i);

  await changeOrganization(surface, "team-with-us", where, other);

  await expectNowFor(surface, "team-with-us", where, other);
});

test(`${statement} (a submitted Sprint With Us proposal keeps the organization it was submitted for)`, async ({
  surface,
}) => {
  test.setTimeout(360000);
  const other = await secondSprintWithUsSupplier(surface, "R-2.22 Second Sprint Supplier For A Submitted Proposal Ltd.");
  const opportunityId = await publishSprintOpportunity(surface, "R-2.22 opportunity whose submitted sprint proposal is moved");
  const proposalId = await submitSprintWithUs(surface, opportunityId);
  const where = { opportunityId, proposalId };

  await attempt(() => changeOrganization(surface, "sprint-with-us", where, other));

  await expectStillSubmittedFor(surface, "sprint-with-us", where, other);
});

test(`${statement} (a withdrawn Sprint With Us proposal may be moved to another organization)`, async ({ surface }) => {
  test.setTimeout(360000);
  const other = await secondSprintWithUsSupplier(surface, "R-2.22 Second Sprint Supplier For A Withdrawn Proposal Ltd.");
  const opportunityId = await publishSprintOpportunity(surface, "R-2.22 opportunity whose withdrawn sprint proposal is moved");
  const proposalId = await submitSprintWithUs(surface, opportunityId);
  const where = { opportunityId, proposalId };

  await surface.proposalSwuEdit.open(where);
  await surface.proposalSwuEdit.withdrawProposal();
  await expect.poll(() => readOrEmpty(() => surface.proposalSwuEdit.status()), settle).toMatch(/withdrawn/i);

  await changeOrganization(surface, "sprint-with-us", where, other);

  await expectNowFor(surface, "sprint-with-us", where, other);
});
