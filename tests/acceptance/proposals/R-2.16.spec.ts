// criterion: @R-2.16 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The vendor persona owns the seeded unqualified organization, which has accepted neither
// program's terms, so it is the organization the criterion's first half is about. The
// create screen's own notice about an unqualified organization is what pins the refusal to
// the organization rather than to anything else on the form.
//
// The criterion's given — an organization that has since lost its qualified status — cannot
// be produced: an organization qualifies by having members, capabilities and accepted
// terms, and taking any of those away from the seeded qualified organization would leave
// every other test bidding against a different world. The second test therefore reads the
// re-check the other way round, which the surface can reach: the draft naming an
// unqualified organization is accepted, and the submission of that same draft is not, so
// the check runs at submission and not only when the proposal is written. What the second
// refusal says is not asserted, because the proposal management screen names no error.

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
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
    title,
  });
  await surface.signOut();
}

async function answerAndReference(surface: Surface): Promise<void> {
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

test("a Sprint With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program", async ({
  surface,
}) => {
  const title = "R-2.16 opportunity bid on by an unqualified organization";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalSwuCreate.open({ opportunity: title });
  await surface.proposalSwuCreate.chooseOrganization({
    organization: seed.organizations.unqualified,
  });
  expect(await surface.proposalSwuCreate.unqualifiedOrganizationNotice()).toBeTruthy();

  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.submitProposal();

  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(title);
});

test("the organization a Sprint With Us proposal names is re-checked at the moment of submission", async ({
  surface,
}) => {
  const title = "R-2.16 opportunity whose unqualified draft is submitted later";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalSwuCreate.open({ opportunity: title });
  await surface.proposalSwuCreate.chooseOrganization({
    organization: seed.organizations.unqualified,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.saveDraft();

  await surface.proposalSwuEdit.open({ opportunity: title });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("draft");

  await surface.proposalSwuEdit.submitProposal();
  await surface.proposalSwuEdit.open({ opportunity: title });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("draft");
});

test("a Sprint With Us proposal naming no organization at all is refused", async ({ surface }) => {
  const title = "R-2.16 opportunity bid on with no organization named";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalSwuCreate.open({ opportunity: title });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.submitProposal();

  expect((await surface.proposalSwuCreate.fieldError()).toLowerCase()).toContain(
    "organization must be specified",
  );
});
