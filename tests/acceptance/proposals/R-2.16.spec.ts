// criterion: @R-2.16 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const CAPABILITY = seed.users.organizationOwner.capabilities[0];
// A capability only this one member holds, so withdrawing it leaves the organization
// short of the full set that qualifies it as a Sprint With Us supplier.
const SOLE_CAPABILITY = seed.users.organizationMember.capabilities[0];

const references = [1, 2, 3].map((order) => ({
  order,
  name: `Reference ${order}`,
  company: `Referring Company ${order}`,
  phone: "250 555 0100",
  email: `reference.${order}@example.test`,
}));

async function publishOpportunity(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "implementation",
    startDate: "2030-07-01",
    completionDate: "2030-12-31",
    maxBudget: 100000,
    requiredCapabilities: [CAPABILITY],
  });
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
    totalMaxBudget: 100000,
    proposalDeadline: FUTURE_DEADLINE,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
  });
}

async function fillProposal(surface: Surface, title: string) {
  await surface.proposalSwuCreate.open({ opportunityTitle: title });
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
    proposedCost: 90000,
  });
  await surface.proposalSwuCreate.answerTeamQuestion({
    order: 1,
    response: "We would deliver it in one implementation phase.",
  });
  for (const reference of references) {
    await surface.proposalSwuCreate.addReference(reference);
  }
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
}

test("a Sprint With Us proposal may only be submitted on behalf of a qualified supplier, and the organization is re-checked at the moment of submission", async ({
  surface,
}) => {
  const title = "R-2.16 organization loses its qualification";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuCreate.open({ opportunityTitle: title });
  await surface.proposalSwuCreate.chooseOrganization(seed.organizations.qualified);
  await surface.proposalSwuCreate.saveDraft({});

  // The organization was a qualified supplier when the draft named it, and stops being
  // one before the draft is submitted.
  await surface.signIn(persona.organizationMember);
  await surface.userProfileCapabilities.open();
  await surface.userProfileCapabilities.toggleCapability({ capability: SOLE_CAPABILITY });

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ organizationId: seed.organizations.qualified.id });
  expect(await surface.organizationEdit.swuQualifiedBadge()).toBeFalsy();

  await fillProposal(surface, title);
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.unqualifiedOrganizationNotice()).toBeTruthy();

  // Put the capability back so the seeded organization is a qualified supplier again.
  await surface.signIn(persona.organizationMember);
  await surface.userProfileCapabilities.open();
  await surface.userProfileCapabilities.toggleCapability({ capability: SOLE_CAPABILITY });
});

test("a Sprint With Us proposal naming no organization at all is refused with a message saying one must be specified", async ({
  surface,
}) => {
  const title = "R-2.16 no organization named";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.organizationOwner);
  await fillProposal(surface, title);
  await surface.proposalSwuCreate.submitProposal();

  expect(await surface.proposalSwuCreate.fieldError()).toContain(
    "An organization must be specified before submitting."
  );
});
