// criterion: @R-2.19 v3
// provenance: blind, spec@258c8b6542d73fd923b7fbc7b8c8d9d82627255b, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// One opportunity shape serves the whole file: a prototype phase wanting frontend work and an
// implementation phase wanting backend work, each with its own maximum budget, and no
// inception phase. The qualified organization's administrator holds the frontend capability
// and its owner the backend one, so a proposal naming the administrator in the prototype
// phase and the owner in the implementation phase is complete, and each refusal test spoils
// exactly one thing about it.
//
// The form is read through what it shows against each phase and cost: phase_team_sections
// for the sections it offers, phase_requirements for which phase is incomplete and which
// capabilities it still lacks, and cost_errors for which cost — a phase's or the total — is
// over its budget. While any of those shows a fault the form keeps its submit control
// unavailable, so a refusal test tries to submit anyway and then reads that no proposal came
// of it.
//
// What the form cannot be made to send — a team for a phase it offers no section for, two
// scrum masters in one phase, a phase with none, a person whose membership is unconfirmed —
// is put to the service through proposal-team-request, whose refusal_by_field says which
// phase a message stands against.
//
// The capability test puts each capability in the wrong phase: between them the two phases
// hold both, but neither phase holds its own, which is what "every capability that phase
// requires" turns on.
//
// The total budget is exceeded with phase budgets that sum to more than the opportunity's
// total, and each phase's cost inside its own budget. Nothing the specification states
// refuses such an opportunity; if publishing it were refused, the poll for its identifier
// fails in setup and says so.

const statement =
  "A Sprint With Us proposal can be submitted only when it gives a team to every phase the opportunity has and to no other phase, the proposal form offering a team section for exactly the opportunity's phases; each phase has exactly one scrum master, chosen as a single choice among that phase's members; each phase has at least one confirmed member, and those members together hold every capability that phase requires; each phase's proposed cost is no more than that phase's maximum budget, and the total proposed cost is no more than the opportunity's total maximum budget. A proposal missing a phase team or a phase capability, or with a cost over budget, is not submitted, and the form shows which phase is incomplete or which cost is over its budget.";

const settle = { timeout: 20000 };
const organization = seed.organizations.qualified;
const PHASES = ["Inception", "Prototype", "Implementation"] as const;

type Person = { name: string };
type PhaseTeam = { members: Person[]; scrumMaster?: Person; cost: number };
type Phases = { Prototype: PhaseTeam; Implementation: PhaseTeam };

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

// A listing observation, one entry per phase or per message, whether the adapter gives it as
// JSON or as lines of text.
function entriesOf(listing: string): string[] {
  try {
    const parsed = JSON.parse(listing);
    if (Array.isArray(parsed)) return parsed.map((e) => (typeof e === "string" ? e : JSON.stringify(e)));
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
    }
  } catch {
    // Not JSON; read as lines below.
  }
  return listing
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function entryFor(listing: string, against: RegExp): string {
  return entriesOf(listing).find((entry) => against.test(entry)) ?? "";
}

// The phase names a listing mentions, in the order it mentions them.
function phaseNamesIn(listing: string): string[] {
  return [...listing.matchAll(new RegExp(`\\b(${PHASES.join("|")})\\b`, "g"))].map((m) => m[1]);
}

function readsIncomplete(entry: string): boolean {
  return /\bincomplete\b|not complete|"?complete"?\s*[:=]\s*(false|no)\b/i.test(entry);
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

// Opens the proposal form as the organization's administrator and fills it, without submitting.
async function fillForm(surface: Surface, opportunityId: string, phases: Phases): Promise<void> {
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
}

// The form keeps its submit control unavailable while it shows a fault; trying it anyway is
// what a vendor can do, and what follows is read from whether a proposal came of it.
async function trySubmit(surface: Surface): Promise<void> {
  try {
    await surface.proposalSwuCreate.submitProposal();
  } catch {
    // Unavailable: nothing was sent.
  }
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

async function expectNotSubmitted(surface: Surface, what: string): Promise<void> {
  expect(
    await readOrEmpty(() => surface.proposalSwuEdit.proposalIdentifier()),
    `${what} was submitted`,
  ).toBeFalsy();
}

// Waits until the form shows, against the phase named, that its section is incomplete.
async function expectPhaseIncomplete(surface: Surface, phase: string, what: string): Promise<string> {
  const against = new RegExp(`\\b${phase}\\b`);
  await expect
    .poll(
      async () => readsIncomplete(entryFor(await readOrEmpty(() => surface.proposalSwuCreate.phaseRequirements()), against)),
      { ...settle, message: `the form shows the ${phase} phase incomplete for ${what}` },
    )
    .toBe(true);
  return entryFor(await readOrEmpty(() => surface.proposalSwuCreate.phaseRequirements()), against);
}

async function expectPhaseComplete(surface: Surface, phase: string, what: string): Promise<void> {
  const entry = entryFor(await readOrEmpty(() => surface.proposalSwuCreate.phaseRequirements()), new RegExp(`\\b${phase}\\b`));
  expect(entry, `the form lists the ${phase} phase's requirements for ${what}`).toBeTruthy();
  expect(readsIncomplete(entry), `the form shows the ${phase} phase incomplete for ${what}`).toBe(false);
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

// The refusal's message standing against the phase named, holding the wording given.
async function expectRefusedAgainstPhase(surface: Surface, phase: string, wording: RegExp, what: string): Promise<void> {
  const byField = await readOrEmpty(() => surface.proposalTeamRequest.refusalByField());
  const located = entriesOf(byField).filter((entry) => new RegExp(`\\b${phase}\\b`).test(entry));
  expect(
    located.some((entry) => wording.test(entry)),
    `${what}: the refusal says ${wording} against the ${phase} phase (refusal was ${byField})`,
  ).toBe(true);
}

const complete = (): Phases => ({
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

const completeByRequest = () => [
  { phase: "Prototype", members: [{ member: seed.users.organizationAdmin, scrumMaster: true }], proposedCost: 150000 },
  { phase: "Implementation", members: [{ member: seed.users.organizationOwner, scrumMaster: true }], proposedCost: 250000 },
];

test(`${statement} (a proposal meeting every rule is submitted)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on with a complete proposal");
  await fillForm(surface, opportunityId, complete());
  await expectPhaseComplete(surface, "Prototype", "a complete proposal");
  await expectPhaseComplete(surface, "Implementation", "a complete proposal");
  expect(entriesOf(await readOrEmpty(() => surface.proposalSwuCreate.costErrors())), "cost errors on a complete proposal").toEqual([]);
  await surface.proposalSwuCreate.submitProposal();
  await expectSubmitted(surface, "a proposal meeting every rule");
});

test(`${statement} (the proposal form offers a team section for exactly the opportunity's phases)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity whose form offers its own phases");
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalSwuCreate.open({ opportunityId });
  await surface.proposalSwuCreate.chooseOrganization({ organization });
  await expect
    .poll(async () => phaseNamesIn(await readOrEmpty(() => surface.proposalSwuCreate.phaseTeamSections())), {
      ...settle,
      message: "the form offers a team section for the prototype and implementation phases and no other",
    })
    .toEqual(["Prototype", "Implementation"]);
});

test(`${statement} (a team for a phase the opportunity does not have is not submitted)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on with an extra inception team");
  await submitByRequest(surface, opportunityId, [
    { phase: "Inception", members: [{ member: seed.users.organizationMember, scrumMaster: true }], proposedCost: 50000 },
    ...completeByRequest(),
  ]);
  await expectRefusedByService(surface, "a proposal giving a team to a phase the opportunity does not have");
  await expectRefusedAgainstPhase(
    surface,
    "Inception",
    /does not require this phase/i,
    "a proposal giving a team to a phase the opportunity does not have",
  );
});

test(`${statement} (a proposal leaving out a phase the opportunity has is not submitted)`, async ({ surface }) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on without its prototype phase");
  await submitByRequest(surface, opportunityId, completeByRequest().filter((p) => p.phase !== "Prototype"));
  await expectRefusedByService(surface, "a proposal leaving out the prototype phase");
  await expectRefusedAgainstPhase(
    surface,
    "Prototype",
    /requires this phase/i,
    "a proposal leaving out the prototype phase",
  );
});

test(`${statement} (a proposal missing a phase team is not submitted, and the form shows which phase is incomplete)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on with a phase left without a team");
  await fillForm(surface, opportunityId, {
    ...complete(),
    Prototype: { members: [], cost: 150000 },
  });
  await expectPhaseIncomplete(surface, "Prototype", "a proposal whose prototype phase has no team");
  await expectPhaseComplete(surface, "Implementation", "a proposal whose prototype phase has no team");
  await trySubmit(surface);
  await expectNotSubmitted(surface, "a proposal whose prototype phase has no team");
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
  await expectRefusedAgainstPhase(
    surface,
    "Implementation",
    /single scrum master/i,
    "a phase naming two scrum masters",
  );
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

test(`${statement} (a proposal missing a phase capability is not submitted, and the form shows which phase is incomplete)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on with capabilities in the wrong phases");
  const what = "a proposal whose phases each lack the capability they require";
  await fillForm(surface, opportunityId, {
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
  const prototype = await expectPhaseIncomplete(surface, "Prototype", what);
  expect(prototype, "the prototype phase names the capability it lacks").toMatch(/Frontend Development/);
  const implementation = await expectPhaseIncomplete(surface, "Implementation", what);
  expect(implementation, "the implementation phase names the capability it lacks").toMatch(/Backend Development/);
  await trySubmit(surface);
  await expectNotSubmitted(surface, what);
});

test(`${statement} (a proposal with a phase cost over that phase's budget is not submitted, and the form shows which cost is over its budget)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(surface, "R-2.19 opportunity bid on above one phase's budget");
  const what = "a proposal whose prototype cost exceeds the prototype budget";
  await fillForm(surface, opportunityId, {
    Prototype: { ...complete().Prototype, cost: 250000 },
    Implementation: { ...complete().Implementation, cost: 200000 },
  });
  await expect
    .poll(async () => entryFor(await readOrEmpty(() => surface.proposalSwuCreate.costErrors()), /\bPrototype\b/), {
      ...settle,
      message: `the form shows the prototype cost over its budget for ${what}`,
    })
    .toMatch(/less than or equal to 200,000/);
  const errors = await readOrEmpty(() => surface.proposalSwuCreate.costErrors());
  expect(entryFor(errors, /\bImplementation\b/), "the implementation cost is within its budget").toBe("");
  expect(entryFor(errors, /\btotal\b/i), "the total cost is within its budget").toBe("");
  await trySubmit(surface);
  await expectNotSubmitted(surface, what);
});

test(`${statement} (a proposal with a total cost over the opportunity's total budget is not submitted, and the form shows which cost is over its budget)`, async ({
  surface,
}) => {
  test.setTimeout(180000);
  const opportunityId = await publishSprintOpportunity(
    surface,
    "R-2.19 opportunity bid on above its total budget",
    400000,
  );
  const what = "a proposal whose total cost exceeds the opportunity's total budget";
  await fillForm(surface, opportunityId, {
    Prototype: { ...complete().Prototype, cost: 190000 },
    Implementation: { ...complete().Implementation, cost: 290000 },
  });
  await expect
    .poll(async () => entryFor(await readOrEmpty(() => surface.proposalSwuCreate.costErrors()), /\btotal\b/i), {
      ...settle,
      message: `the form shows the total cost over the opportunity's budget for ${what}`,
    })
    .toMatch(/exceeds the maximum budget for this opportunity/i);
  const errors = await readOrEmpty(() => surface.proposalSwuCreate.costErrors());
  expect(entryFor(errors, /\bPrototype\b/), "the prototype cost is within its budget").toBe("");
  expect(entryFor(errors, /\bImplementation\b/), "the implementation cost is within its budget").toBe("");
  await trySubmit(surface);
  await expectNotSubmitted(surface, what);
});
