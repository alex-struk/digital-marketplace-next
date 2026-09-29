// criterion: @R-2.19 v3
// provenance: blind, spec@258c8b6542d73fd923b7fbc7b8c8d9d82627255b, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// One opportunity shape serves the whole file: a prototype phase wanting frontend work and an
// implementation phase wanting backend work, each with its own maximum budget. The qualified
// organization's administrator holds the frontend capability and its owner the backend one,
// so a proposal naming the administrator in the prototype phase and the owner in the
// implementation phase is complete, and each refusal test spoils exactly one thing about it.
//
// Most tests go through the proposal form, which is what the criterion's last sentence is
// about. The scrum master and confirmed-member rules are put to the service through
// proposal-team-request as well, because the form's single choice and its hiding of the
// submit control for a pending person keep a vendor from ever sending those proposals, and
// the criterion still says the service does not submit them.
//
// The capability test puts each capability in the wrong phase: between them the two phases
// hold both, but neither phase holds its own, which is what "every capability that phase
// requires" turns on.
//
// The total budget is exceeded with phase budgets that sum to more than the opportunity's
// total, and each phase's cost inside its own budget. Nothing the specification states
// refuses such an opportunity; if publishing it were refused, the poll for its identifier
// fails in setup and says so.
//
// Not asserted here, and recorded in not-testable.yaml: that the form offers a team section
// for exactly the opportunity's phases, and which phase or which cost the form's message
// stands against — the create screen's error observations are text without a location.

const statement =
  "A Sprint With Us proposal can be submitted only when it gives a team to every phase the opportunity has and to no other phase, the proposal form offering a team section for exactly the opportunity's phases; each phase has exactly one scrum master, chosen as a single choice among that phase's members; each phase has at least one confirmed member, and those members together hold every capability that phase requires; each phase's proposed cost is no more than that phase's maximum budget, and the total proposed cost is no more than the opportunity's total maximum budget. A proposal missing a phase team or a phase capability, or with a cost over budget, is not submitted, and the form shows which phase is incomplete or which cost is over its budget.";

const settle = { timeout: 20000 };
const organization = seed.organizations.qualified;

type Person = { name: string };
type PhaseTeam = { members: Person[]; scrumMaster?: Person; cost: number };

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

const references = [0, 1, 2].map((order) => ({
  order,
  name: `Reference ${order + 1}`,
  company: "Reference Company Ltd.",
  phone: "250-555-0101",
  email: `reference.${order + 1}@example.test`,
}));

const answer = {
  order: 0,
  response: "We delivered a scheduling service for a health authority over eighteen months.",
};

async function publishSprintOpportunity(
  surface: Surface,
  title: string,
  totalMaxBudget = 500000,
): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Prototype",
    startDate: inDays(28),
    completionDate: inDays(60),
    maxBudget: 200000,
    capabilities: ["Frontend Development"],
  });
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(61),
    completionDate: inDays(90),
    maxBudget: 300000,
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
    mandatorySkills: ["Frontend Development", "Backend Development"],
    totalMaxBudget,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
    title,
  });
  await expect
    .poll(() => readOrEmpty(() => surface.opportunitySwuEdit.opportunityIdentifier()), {
      ...settle,
      message: "the opportunity was published",
    })
    .toBeTruthy();
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

// Fills the proposal form as the organization's administrator and submits it.
async function submitThroughForm(
  surface: Surface,
  opportunityId: string,
  phases: { Prototype: PhaseTeam; Implementation: PhaseTeam },
): Promise<void> {
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalSwuCreate.open({ opportunityId });
  await surface.proposalSwuCreate.chooseOrganization({ organization });
  for (const [phase, team] of Object.entries(phases)) {
    for (const member of team.members) {
      await surface.proposalSwuCreate.addPhaseTeamMember({ phase, member });
    }
    if (team.scrumMaster) {
      await surface.proposalSwuCreate.setScrumMaster({ phase, member: team.scrumMaster });
    }
    await surface.proposalSwuCreate.setPhaseProposedCost({ phase, cost: team.cost });
  }
  await surface.proposalSwuCreate.answerTeamQuestion(answer);
  for (const reference of references) {
    await surface.proposalSwuCreate.addReference(reference);
  }
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
  await surface.proposalSwuCreate.submitProposal();
}

async function expectSubmitted(surface: Surface, what: string): Promise<void> {
  await expect
    .poll(() => readOrEmpty(() => surface.proposalSwuEdit.proposalIdentifier()), {
      ...settle,
      message: `${what} was submitted`,
    })
    .toBeTruthy();
  expect(await readOrEmpty(() => surface.proposalSwuEdit.status()), what).toMatch(/submitted/i);
}

async function expectRefusedOnForm(
  surface: Surface,
  read: () => Promise<string>,
  what: string,
): Promise<void> {
  await expect
    .poll(() => readOrEmpty(read), { ...settle, message: `the form shows why ${what} was refused` })
    .toBeTruthy();
  expect(
    await readOrEmpty(() => surface.proposalSwuEdit.proposalIdentifier()),
    `${what} was submitted`,
  ).toBeFalsy();
}

async function submitByRequest(
  surface: Surface,
  opportunityId: string,
  phases: Array<{ phase: string; members: Array<{ member: Person; scrumMaster: boolean }>; proposedCost: number }>,
): Promise<void> {
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalTeamRequest.open({ program: "sprint-with-us" });
  await surface.proposalTeamRequest.submitTeamProposal({
    opportunityId,
    organization,
    phases,
    answers: [answer],
    references,
  });
}

async function expectRefusedByService(surface: Surface, what: string): Promise<void> {
  await expect
    .poll(
      async () =>
        (await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted())) ||
        (await readOrEmpty(() => surface.proposalTeamRequest.refusalStatus())),
      { ...settle, message: "the service answered the request" },
    )
    .toBeTruthy();
  expect(await readOrEmpty(() => surface.proposalTeamRequest.requestAccepted()), what).toBeFalsy();
  expect(await readOrEmpty(() => surface.proposalTeamRequest.refusalMessages()), what).toBeTruthy();
}

const complete = () => ({
  Prototype: {
    members: [seed.users.organizationAdmin],
    scrumMaster: seed.users.organizationAdmin,
    cost: 150000,
  },
  Implementation: {
    members: [seed.users.organizationOwner],
    scrumMaster: seed.users.organizationOwner,
    cost: 250000,
  },
});

test(`${statement} (a proposal meeting every rule is submitted)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on with a complete proposal");
  await submitThroughForm(surface, opportunityId, complete());
  await expectSubmitted(surface, "a proposal meeting every rule");
});

test(`${statement} (a proposal missing a phase team is not submitted)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on with a phase left without a team");
  await submitThroughForm(surface, opportunityId, {
    ...complete(),
    Prototype: { members: [], cost: 150000 },
  });
  await expectRefusedOnForm(
    surface,
    () => surface.proposalSwuCreate.fieldError(),
    "a proposal whose prototype phase has no team",
  );
});

test(`${statement} (the scrum master is a single choice among the phase's members)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on after changing a scrum master");
  // Choosing a second scrum master in the same phase replaces the first; were both kept, the
  // service would refuse the phase for having two, so the proposal going through shows it.
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalSwuCreate.open({ opportunityId });
  await surface.proposalSwuCreate.chooseOrganization({ organization });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "Prototype", member: seed.users.organizationAdmin });
  await surface.proposalSwuCreate.setScrumMaster({ phase: "Prototype", member: seed.users.organizationAdmin });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Prototype", cost: 150000 });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "Implementation", member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "Implementation", member: seed.users.organizationMember });
  await surface.proposalSwuCreate.setScrumMaster({ phase: "Implementation", member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.setScrumMaster({ phase: "Implementation", member: seed.users.organizationMember });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 250000 });
  await surface.proposalSwuCreate.answerTeamQuestion(answer);
  for (const reference of references) {
    await surface.proposalSwuCreate.addReference(reference);
  }
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
  await surface.proposalSwuCreate.submitProposal();
  await expectSubmitted(surface, "a proposal whose implementation scrum master was chosen twice");
});

test(`${statement} (a phase with two scrum masters is not submitted)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on with two scrum masters in one phase");
  await submitByRequest(surface, opportunityId, [
    { phase: "Prototype", members: [{ member: seed.users.organizationAdmin, scrumMaster: true }], proposedCost: 150000 },
    {
      phase: "Implementation",
      members: [
        { member: seed.users.organizationOwner, scrumMaster: true },
        { member: seed.users.organizationMember, scrumMaster: true },
      ],
      proposedCost: 250000,
    },
  ]);
  await expectRefusedByService(surface, "a phase naming two scrum masters");
});

test(`${statement} (a phase with no scrum master is not submitted)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on with a phase lacking a scrum master");
  await submitByRequest(surface, opportunityId, [
    { phase: "Prototype", members: [{ member: seed.users.organizationAdmin, scrumMaster: true }], proposedCost: 150000 },
    {
      phase: "Implementation",
      members: [{ member: seed.users.organizationOwner, scrumMaster: false }],
      proposedCost: 250000,
    },
  ]);
  await expectRefusedByService(surface, "a phase naming no scrum master");
});

test(`${statement} (a phase whose only holder of a required capability is not a confirmed member is not submitted)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on with an unconfirmed member");
  // The person whose invitation is unanswered holds the backend capability the
  // implementation phase wants; the confirmed member beside them does not.
  await submitByRequest(surface, opportunityId, [
    { phase: "Prototype", members: [{ member: seed.users.organizationAdmin, scrumMaster: true }], proposedCost: 150000 },
    {
      phase: "Implementation",
      members: [
        { member: seed.users.organizationMember, scrumMaster: true },
        { member: seed.users.teamCandidatePending, scrumMaster: false },
      ],
      proposedCost: 250000,
    },
  ]);
  await expectRefusedByService(surface, "a phase relying on a person who is not a confirmed member");
});

test(`${statement} (a proposal missing a phase capability is not submitted)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on with capabilities in the wrong phases");
  await submitThroughForm(surface, opportunityId, {
    Prototype: {
      members: [seed.users.organizationOwner],
      scrumMaster: seed.users.organizationOwner,
      cost: 150000,
    },
    Implementation: {
      members: [seed.users.organizationAdmin],
      scrumMaster: seed.users.organizationAdmin,
      cost: 250000,
    },
  });
  await expectRefusedOnForm(
    surface,
    () => surface.proposalSwuCreate.capabilityGapError(),
    "a proposal whose phases each lack the capability they require",
  );
});

test(`${statement} (a proposal with a phase cost over that phase's budget is not submitted)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on above one phase's budget");
  await submitThroughForm(surface, opportunityId, {
    Prototype: { ...complete().Prototype, cost: 250000 },
    Implementation: { ...complete().Implementation, cost: 200000 },
  });
  await expectRefusedOnForm(
    surface,
    () => surface.proposalSwuCreate.budgetExceededError(),
    "a proposal whose prototype cost exceeds the prototype budget",
  );
});

test(`${statement} (a proposal with a total cost over the opportunity's total budget is not submitted)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(
    surface,
    "R-2.19 opportunity bid on above its total budget",
    400000,
  );
  await submitThroughForm(surface, opportunityId, {
    Prototype: { ...complete().Prototype, cost: 190000 },
    Implementation: { ...complete().Implementation, cost: 290000 },
  });
  await expectRefusedOnForm(
    surface,
    () => surface.proposalSwuCreate.budgetExceededError(),
    "a proposal whose total cost exceeds the opportunity's total budget",
  );
});
