// criterion: @R-2.37 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The first two tests read a copy as the vendor who wrote the proposal, who is entitled to
// it while the opportunity is still open, and whose copy names the organization outright.
//
// The third is the contrast the criterion draws, and it needs an opportunity that has
// closed, because staff may see no proposal until then (R-2.25). That is the seeded Sprint
// With Us opportunity, closed by the service's own deadline hook through
// run_pending_transitions, and read without changing anything.
//
// The last clause — that once the proposal reaches the code challenge the staff copy names
// the organization too — is not asserted. Reaching the challenge stage means scoring every
// proponent's questions and finalising the panel's agreed scores, and the seed carries one
// closed Sprint With Us opportunity: a test that walked it that far would take it away from
// every other criterion behind the closure. See R-2.29 in not-testable.yaml.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const shared = {
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

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function closeOverdueOpportunities(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

async function publishSprintOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 500000,
    capabilities: ["Frontend Development"],
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
    ...shared,
    mandatorySkills: ["Frontend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
    title,
  });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

async function submitSprintProposal(surface: Surface, opportunityId: string): Promise<string> {
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalSwuCreate.open({ opportunityId });
  await surface.proposalSwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationAdmin,
  });
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
  await surface.proposalSwuCreate.submitProposal();
  return surface.proposalSwuEdit.proposalIdentifier();
}

test("anyone entitled to read a proposal can take away a printable copy of it", async ({
  surface,
}) => {
  const proposalText = "A proposal its author takes away as a printable copy.";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...shared,
    completionDate: inDays(35),
    reward: 5000,
    skills: ["Backend Development"],
    title: "R-2.37 opportunity whose proposal is taken away as a printable copy",
  });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({ proposalText });
  const proposalId = await surface.proposalCwuEdit.proposalIdentifier();

  await surface.proposalCwuExportOne.open({ opportunityId, proposalId });
  expect(await surface.proposalCwuExportOne.exportedProposal()).toContain(proposalText);
});

test("the vendor's own copy of a Sprint With Us proposal names the organization", async ({
  surface,
}) => {
  const opportunityId = await publishSprintOpportunity(
    surface,
    "R-2.37 Sprint With Us opportunity whose vendor reads their own copy",
  );
  const proposalId = await submitSprintProposal(surface, opportunityId);

  await surface.proposalSwuExportOne.open({ opportunityId, proposalId });
  expect(await surface.proposalSwuExportOne.exportedProposal()).toContain(
    seed.organizations.qualified.legal_name,
  );
  expect(await surface.proposalSwuExportOne.anonymousProponentName()).toBeFalsy();
});

test("staff reading a Sprint With Us copy see the anonymous proponent name before the challenge stage", async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  await surface.signIn(persona.publicSectorStaff);
  await surface.proposalSwuExportOne.open({
    opportunityId: seed.opportunities.closedSprintWithUs.id,
    proposalId: seed.proposals.sprintWithUsOne.id,
  });

  expect(await surface.proposalSwuExportOne.anonymousProponentName()).toContain("Proponent");
  expect(await surface.proposalSwuExportOne.exportedProposal()).not.toContain(
    seed.organizations.qualified.legal_name,
  );
});
