// criterion: @R-2.19 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const OWNER_CAPABILITY = seed.users.organizationOwner.capabilities[0];
// Held by a member of the organization who is not on the proposed team.
const UNCOVERED_CAPABILITY = seed.users.organizationMember.capabilities[0];

const references = [1, 2, 3].map((order) => ({
  order,
  name: `Reference ${order}`,
  company: `Referring Company ${order}`,
  phone: "250 555 0100",
  email: `reference.${order}@example.test`,
}));

async function publishOpportunity(
  surface: Surface,
  title: string,
  phases: Array<{ phase: string; maxBudget: number; requiredCapabilities: string[] }>,
  totalMaxBudget: number
) {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  for (const phase of phases) {
    await surface.opportunitySwuCreate.addPhase({
      ...phase,
      startDate: "2030-07-01",
      completionDate: "2030-12-31",
    });
  }
  await surface.opportunitySwuCreate.addTeamQuestion({
    order: 1,
    question: "How would you deliver this work?",
    wordLimit: 300,
    minimumScore: 1,
    score: 100,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel({
    members: [persona.evaluationPanelEvaluator, persona.evaluationPanelChair],
    chair: persona.evaluationPanelChair,
  });
  await surface.opportunitySwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    totalMaxBudget,
    proposalDeadline: FUTURE_DEADLINE,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
  });
}

async function startProposal(surface: Surface, title: string) {
  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuCreate.open({ opportunityTitle: title });
  await surface.proposalSwuCreate.chooseOrganization(seed.organizations.qualified);
  await surface.proposalSwuCreate.answerTeamQuestion({
    order: 1,
    response: "We would deliver it as described above.",
  });
  for (const reference of references) {
    await surface.proposalSwuCreate.addReference(reference);
  }
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
}

const twoPhases = [
  { phase: "inception", maxBudget: 50000, requiredCapabilities: [OWNER_CAPABILITY] },
  { phase: "implementation", maxBudget: 50000, requiredCapabilities: [OWNER_CAPABILITY] },
];
const onePhase = [
  { phase: "implementation", maxBudget: 100000, requiredCapabilities: [OWNER_CAPABILITY] },
];

test("a Sprint With Us proposal must offer a team for every phase the opportunity requires", async ({
  surface,
}) => {
  const title = "R-2.19 a required phase is missing";
  await publishOpportunity(surface, title, twoPhases, 100000);
  await startProposal(surface, title);

  // Only the second of the opportunity's two phases is offered a team.
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({
    phase: "implementation",
    proposedCost: 40000,
  });
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us proposal must offer no phase the opportunity does not require", async ({
  surface,
}) => {
  const title = "R-2.19 a phase the opportunity does not have";
  await publishOpportunity(surface, title, onePhase, 100000);
  await startProposal(surface, title);

  for (const phase of ["implementation", "inception"]) {
    await surface.proposalSwuCreate.addPhaseTeamMember({
      phase,
      member: seed.users.organizationOwner,
    });
    await surface.proposalSwuCreate.setScrumMaster({
      phase,
      member: seed.users.organizationOwner,
    });
    await surface.proposalSwuCreate.setPhaseProposedCost({ phase, proposedCost: 40000 });
  }
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us proposal may name no more than one scrum master in each phase", async ({
  surface,
}) => {
  const title = "R-2.19 two scrum masters in one phase";
  await publishOpportunity(surface, title, onePhase, 100000);
  await startProposal(surface, title);

  for (const member of [seed.users.organizationOwner, seed.users.organizationAdmin]) {
    await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "implementation", member });
    await surface.proposalSwuCreate.setScrumMaster({ phase: "implementation", member });
  }
  await surface.proposalSwuCreate.setPhaseProposedCost({
    phase: "implementation",
    proposedCost: 40000,
  });
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toBeTruthy();
});

test("a Sprint With Us proposal must cover every capability the opportunity requires across its phases", async ({
  surface,
}) => {
  const title = "R-2.19 a required capability is uncovered";
  await publishOpportunity(
    surface,
    title,
    [
      {
        phase: "implementation",
        maxBudget: 100000,
        requiredCapabilities: [OWNER_CAPABILITY, UNCOVERED_CAPABILITY],
      },
    ],
    100000
  );
  await startProposal(surface, title);

  // The one person offered holds only one of the two required capabilities.
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({
    phase: "implementation",
    proposedCost: 40000,
  });
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.capabilityGapError()).toBeTruthy();
});

test("a Sprint With Us proposal must stay within each phase's budget and the opportunity's total budget", async ({
  surface,
}) => {
  const title = "R-2.19 above the opportunity's budget";
  await publishOpportunity(surface, title, onePhase, 100000);
  await startProposal(surface, title);

  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({
    phase: "implementation",
    proposedCost: 150000,
  });
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.budgetExceededError()).toBeTruthy();
});
