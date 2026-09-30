// criterion: @R-2.18 v4
// provenance: blind, spec@58f7a2a6d352ffc30afadcf64eaf66c786693898, derived 2026-09-30
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The service's refusals are put to it through proposal-team-request, which carries any seed
// user as a team member, repeats included, and sends the proposal as a submission. The
// organization is the qualified one, qualified for both programs; its administrator signs in
// and submits for it. Three people stand outside its active membership: one whose invitation
// is unanswered, one whose membership has ended, and one who belongs to no organization.
//
// Each test publishes its own opportunity, since both programs' seeded ones have closed. The
// Team With Us opportunity asks for two resources, in the two service areas the organization
// offers, so a team can name the same person twice by naming them for both. The Sprint With
// Us opportunity has one phase wanting backend work, which the organization's owner holds.
//
// A Sprint With Us phase naming one person twice may still fail after validation, when the
// service stores it; the criterion is only that no uniqueness refusal is given, so that is
// what the test asserts.
//
// What the form offers is read from the team-member choice on each create page, by account
// name as the seed gives it. Each of the organization's three active people is offered, the
// person whose membership ended and the person outside it are not, and a person once named
// is offered no longer. The Team With Us choice leaves out the person whose invitation is
// unanswered; the Sprint With Us choice lists them, and once named they are marked pending.
// A Sprint With Us proposal naming them is saved as a draft from the create page, then
// submitted from its own page, and stays a draft.

const notActiveMember = "User is not an active member of the organization.";
const notUnique = "Please select unique team members.";

const statement =
  'Every person named on a proposal\'s team must be an active member of the organization the proposal is submitted for, and the service refuses anyone else with "User is not an active member of the organization."; a Team With Us proposal is additionally refused by the service when the same person is named twice, with "Please select unique team members.", while the service applies no such uniqueness check to a Sprint With Us phase. The Team With Us proposal form offers only the organization\'s active members; the Sprint With Us form also lists members whose invitation is still pending, marked pending, and a proposal naming one can be saved as a draft but is refused on submission. Neither form offers a person already named on the proposal.';

const settle = { timeout: 20000 };
const organization = seed.organizations.qualified;
const fullStack = "Full Stack Developer";
const agileCoach = "Agile Coach";

const outsiders: Array<[string, { name: string }]> = [
  ["a person whose invitation to the organization is unanswered", seed.users.teamCandidatePending],
  ["a person whose membership of the organization has ended", seed.users.teamCandidateFormer],
  ["a person who belongs to no organization", seed.users.teamCandidateOutsider],
];

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

async function publishTeamOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  for (const [order, serviceArea] of [fullStack, agileCoach].entries()) {
    await surface.opportunityTwuCreate.addResource({ serviceArea, targetAllocation: 100, order });
  }
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

async function submitTeamWithUs(
  surface: Surface,
  opportunityId: string,
  team: Array<{ member: unknown; resource: string }>,
): Promise<void> {
  await surface.proposalTeamRequest.open({ program: "team-with-us" });
  await surface.proposalTeamRequest.submitTeamProposal({
    opportunityId,
    organization,
    team: team.map((entry) => ({ ...entry, hourlyRate: 100 })),
    answers: [
      { order: 0, response: "Our developer built and ran the same kind of service for a Crown corporation." },
    ],
  });
}

async function submitSprintWithUs(
  surface: Surface,
  opportunityId: string,
  members: Array<{ member: unknown; scrumMaster: boolean }>,
): Promise<void> {
  await surface.proposalTeamRequest.open({ program: "sprint-with-us" });
  await surface.proposalTeamRequest.submitTeamProposal({
    opportunityId,
    organization,
    phases: [{ phase: "Implementation", members, proposedCost: 400000 }],
    answers: [{ order: 0, response: "We delivered a scheduling service for a health authority over eighteen months." }],
    references: [0, 1, 2].map((order) => ({
      order,
      name: `Reference ${order + 1}`,
      company: "Reference Company Ltd.",
      phone: "250-555-0101",
      email: `reference.${order + 1}@example.test`,
    })),
  });
}

async function refusalMessages(surface: Surface): Promise<string> {
  await expect
    .poll(
      async () =>
        (await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted())) ||
        (await readOrEmpty(() => surface.proposalTeamRequest.refusalStatus())),
      { ...settle, message: "the service answered the request" },
    )
    .toBeTruthy();
  return readOrEmpty(() => surface.proposalTeamRequest.refusalMessages());
}

async function expectRefusedWith(surface: Surface, message: string, what: string): Promise<void> {
  const messages = await refusalMessages(surface);
  expect(await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted()), what).toBeFalsy();
  expect(messages, what).toContain(message);
}

test(`${statement} (a Team With Us team of active members is accepted)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishTeamOpportunity(surface, "R-2.18 opportunity bid on by active members");
  await surface.signIn(persona.organizationAdmin);
  await submitTeamWithUs(surface, opportunityId, [
    { member: seed.users.organizationAdmin, resource: fullStack },
    { member: seed.users.organizationOwner, resource: agileCoach },
  ]);
  const messages = await refusalMessages(surface);
  expect(messages, "a team of active members was refused").toBe("");
  expect(await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted())).toBeTruthy();
});

for (const [who, person] of outsiders) {
  test(`${statement} (a Team With Us team naming ${who} is refused)`, async ({ surface }) => {
    test.setTimeout(180000);
    const opportunityId = await publishTeamOpportunity(surface, `R-2.18 opportunity bid on naming ${who}`);
    await surface.signIn(persona.organizationAdmin);
    await submitTeamWithUs(surface, opportunityId, [
      { member: seed.users.organizationAdmin, resource: fullStack },
      { member: person, resource: agileCoach },
    ]);
    await expectRefusedWith(surface, notActiveMember, `a team naming ${who}`);
  });
}

const sprintOutsiders: Array<[string, { name: string }]> = [
  ["a person whose invitation to the organization is unanswered", seed.users.teamCandidatePending],
  ["a person who belongs to no organization", seed.users.teamCandidateOutsider],
];

for (const [who, person] of sprintOutsiders) {
  test(`${statement} (a Sprint With Us phase naming ${who} is refused)`, async ({ surface }) => {
    test.setTimeout(180000);
    const opportunityId = await publishSprintOpportunity(surface, `R-2.18 opportunity bid on naming ${who} in a phase`);
    await surface.signIn(persona.organizationAdmin);
    await submitSprintWithUs(surface, opportunityId, [
      { member: seed.users.organizationOwner, scrumMaster: true },
      { member: person, scrumMaster: false },
    ]);
    await expectRefusedWith(surface, notActiveMember, `a phase naming ${who}`);
  });
}

test(`${statement} (a Team With Us team naming the same person twice is refused)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishTeamOpportunity(surface, "R-2.18 opportunity bid on naming one person twice");
  await surface.signIn(persona.organizationAdmin);
  await submitTeamWithUs(surface, opportunityId, [
    { member: seed.users.organizationAdmin, resource: fullStack },
    { member: seed.users.organizationAdmin, resource: agileCoach },
  ]);
  await expectRefusedWith(surface, notUnique, "a team naming the same active member twice");
});

test(`${statement} (a Sprint With Us phase naming the same person twice meets no uniqueness refusal)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.18 opportunity bid on naming one person twice in a phase");
  await surface.signIn(persona.organizationAdmin);
  await submitSprintWithUs(surface, opportunityId, [
    { member: seed.users.organizationOwner, scrumMaster: true },
    { member: seed.users.organizationOwner, scrumMaster: false },
  ]);
  const messages = await refusalMessages(surface);
  expect(messages, "a Sprint With Us phase was refused for naming a person twice").not.toContain(notUnique);
});

const activeMembers: Array<[string, { name: string }]> = [
  ["the organization's owner", seed.users.organizationOwner],
  ["the organization's administrator", seed.users.organizationAdmin],
  ["the organization's member", seed.users.organizationMember],
];

async function readChoices(read: () => Promise<string>, where: string): Promise<string> {
  await expect
    .poll(() => readOrEmpty(read), { ...settle, message: `${where} offers the organization's active members` })
    .toContain(seed.users.organizationMember.name);
  return readOrEmpty(read);
}

// Every active member is offered except the one already named, if any; the person whose
// membership ended and the person outside the organization never are.
function expectOffered(offered: string, named: { name: string } | null, where: string): void {
  for (const [who, person] of activeMembers) {
    if (named && person.name === named.name) {
      expect(offered, `${where} still offers ${who}, already named`).not.toContain(person.name);
    } else {
      expect(offered, `${where} does not offer ${who}`).toContain(person.name);
    }
  }
  expect(offered, `${where} offers a person whose membership has ended`).not.toContain(
    seed.users.teamCandidateFormer.name,
  );
  expect(offered, `${where} offers a person who belongs to no organization`).not.toContain(
    seed.users.teamCandidateOutsider.name,
  );
}

test(`${statement} (the Team With Us form offers only active members, and not a person already named)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = await publishTeamOpportunity(surface, "R-2.18 opportunity whose team form is read");
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalTwuCreate.open({ opportunityId });
  await surface.proposalTwuCreate.chooseOrganization({ organization });
  const read = () => surface.proposalTwuCreate.teamMemberChoices();
  const where = "the Team With Us team choice";

  const before = await readChoices(read, where);
  expectOffered(before, null, where);
  expect(before, `${where} offers a person whose invitation is unanswered`).not.toContain(
    seed.users.teamCandidatePending.name,
  );

  const named = seed.users.organizationAdmin;
  await surface.proposalTwuCreate.addTeamMemberForResource({ resource: fullStack, member: named });
  await expect
    .poll(() => readOrEmpty(read), { ...settle, message: `${where} still offers the person just named` })
    .not.toContain(named.name);
  const after = await readOrEmpty(read);
  expectOffered(after, named, `${where} after naming a member`);
  expect(after, `${where} after naming a member offers a person whose invitation is unanswered`).not.toContain(
    seed.users.teamCandidatePending.name,
  );
});

test(`${statement} (the Sprint With Us form offers the active members and lists a pending member, marked pending, and not a person already named)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.18 opportunity whose phase team form is read");
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalSwuCreate.open({ opportunityId });
  await surface.proposalSwuCreate.chooseOrganization({ organization });
  const read = () => surface.proposalSwuCreate.teamMemberChoices();
  const where = "the Sprint With Us phase team choice";
  const pending = seed.users.teamCandidatePending;

  const before = await readChoices(read, where);
  expectOffered(before, null, where);
  expect(before, `${where} does not list a person whose invitation is unanswered`).toContain(pending.name);

  const named = seed.users.organizationOwner;
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "Implementation", member: named });
  await expect
    .poll(() => readOrEmpty(read), { ...settle, message: `${where} still offers the person just named` })
    .not.toContain(named.name);
  const after = await readOrEmpty(read);
  expectOffered(after, named, `${where} after naming a member`);
  expect(after, `${where} after naming a member no longer lists the pending person`).toContain(pending.name);

  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "Implementation", member: pending });
  await expect
    .poll(() => readOrEmpty(() => surface.proposalSwuCreate.pendingTeamMember()), {
      ...settle,
      message: "the pending person, once named, is not marked pending",
    })
    .toContain(pending.name);
  await expect
    .poll(() => readOrEmpty(read), { ...settle, message: `${where} still offers the pending person just named` })
    .not.toContain(pending.name);
});

async function attempt(act: () => Promise<void>): Promise<void> {
  try {
    await act();
  } catch {
    // The screen may not offer the submission at all; the proposal's status is what is read.
  }
}

test(`${statement} (a Sprint With Us proposal naming a pending member is saved as a draft but refused on submission)`, async ({
  surface,
}) => {
  test.setTimeout(240000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.18 opportunity bid on with a pending member");
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalSwuCreate.open({ opportunityId });
  await surface.proposalSwuCreate.chooseOrganization({ organization });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "Implementation", member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "Implementation", member: seed.users.teamCandidatePending });
  await surface.proposalSwuCreate.setScrumMaster({ phase: "Implementation", member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
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
  await surface.proposalSwuCreate.saveDraft();

  await expect
    .poll(() => readOrEmpty(() => surface.proposalSwuEdit.proposalIdentifier()), {
      ...settle,
      message: "a proposal naming a pending member was not saved as a draft",
    })
    .toBeTruthy();
  const where = { opportunityId, proposalId: await surface.proposalSwuEdit.proposalIdentifier() };
  await expect.poll(() => readOrEmpty(() => surface.proposalSwuEdit.status()), settle).toMatch(/draft/i);

  await attempt(() => surface.proposalSwuEdit.submitProposal());
  await surface.proposalSwuEdit.open(where);
  const status = await readOrEmpty(() => surface.proposalSwuEdit.status());
  expect(status, "a proposal naming a pending member was submitted").not.toMatch(/submitted/i);
  expect(status, "a draft naming a pending member did not stay a draft").toMatch(/draft/i);
});
