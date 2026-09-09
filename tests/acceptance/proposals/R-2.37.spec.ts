// criterion: @R-2.37 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The reader here is the vendor who wrote the proposal, who is entitled to read it while
// the opportunity is still open. The criterion's other reader is the opportunity's author,
// and staff may see no proposal until the opportunity has closed (R-2.25), which no page,
// action or observation brings about (see R-1.1). So the staff copy, and with it the
// anonymous proponent name it shows until the challenge stage, are not asserted.
//
// What the vendor's own copy shows is asserted instead, which is the half of the contrast
// the surface reaches: the organization named outright, and no anonymous proponent name in
// its place.

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

async function publishSprintOpportunity(surface: Surface, title: string): Promise<void> {
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
  await surface.signOut();
}

async function submitSprintProposal(surface: Surface, opportunity: string): Promise<void> {
  await surface.signIn(persona.organizationAdmin);
  await surface.proposalSwuCreate.open({ opportunity });
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
}

test("anyone entitled to read a proposal can take away a printable copy of it", async ({
  surface,
}) => {
  const title = "R-2.37 opportunity whose proposal is taken away as a printable copy";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...shared,
    completionDate: inDays(35),
    reward: 5000,
    skills: ["Backend Development"],
    title,
  });
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal its author takes away as a printable copy.",
  });

  await surface.proposalCwuExportOne.open({ opportunity: title });
  expect(await surface.proposalCwuExportOne.exportedProposal()).toContain(
    "A proposal its author takes away as a printable copy.",
  );
});

test("the vendor's own copy of a Sprint With Us proposal names the organization", async ({
  surface,
}) => {
  const title = "R-2.37 Sprint With Us opportunity whose vendor reads their own copy";
  await publishSprintOpportunity(surface, title);
  await submitSprintProposal(surface, title);

  await surface.proposalSwuExportOne.open({ opportunity: title });
  expect(await surface.proposalSwuExportOne.exportedProposal()).toContain(
    seed.organizations.qualified.legal_name,
  );
  expect(await surface.proposalSwuExportOne.anonymousProponentName()).toBeFalsy();
});
