// criterion: @R-2.11 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The seeded qualified organization has two people who may bid for it, its administrator
// and its owner, so the criterion's "a different vendor who administers that same
// organization" is exactly the second of those two acting after the first.
//
// The identifier of the existing proposal, which the criterion says comes back alongside
// the refusal, is not asserted: no observation on any proposal surface returns a
// proposal's identifier, so there is nothing to read it from.
//
// The other route the criterion names — an existing proposal edited to name an
// organization that already bid — is not exercised here. The proposal management screens
// carry no action that names an organization; see R-2.22, which needs the same reach.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

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
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
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

async function fillSprintProposal(surface: Surface, opportunity: string): Promise<void> {
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
}

test("an organization may appear on at most one proposal per opportunity, and a proposal naming an organization that already bid is refused", async ({
  surface,
}) => {
  const title = "R-2.11 opportunity one organization is named on twice";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await fillSprintProposal(surface, title);
  await surface.proposalSwuCreate.submitProposal();
  await surface.proposalSwuEdit.open({ opportunity: title });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("submitted");
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await fillSprintProposal(surface, title);
  await surface.proposalSwuCreate.submitProposal();

  expect((await surface.proposalSwuCreate.fieldError()).toLowerCase()).toContain(
    "different organization",
  );
});
