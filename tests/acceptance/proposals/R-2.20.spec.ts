// criterion: @R-2.20 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The third clause — that each team member is named against a resource that exists, and
// that the service does not check the resource belongs to the opportunity being bid on — is
// not asserted. The only action that names a resource is add_team_member_for_resource on
// the create screen for one opportunity, so the resources a test can name are that
// opportunity's own; neither a resource that does not exist nor one belonging to a
// different opportunity can be put into the request.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishTeamOpportunity(surface: Surface, title: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    serviceArea: "Full Stack Developer",
    targetAllocation: 100,
    order: 0,
  });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
  await surface.opportunityTwuCreate.publish({
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    title,
  });
  await surface.signOut();
}

async function openProposalForm(surface: Surface, opportunity: string): Promise<void> {
  await surface.proposalTwuCreate.open({ opportunity });
  await surface.proposalTwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 0,
    response: "Our developer built and ran the same kind of service for a Crown corporation.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
}

test("a Team With Us proposal must name at least one team member", async ({ surface }) => {
  const title = "R-2.20 opportunity bid on with nobody on the team";
  await publishTeamOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await openProposalForm(surface, title);
  await surface.proposalTwuCreate.submitProposal();

  expect(await surface.proposalTwuCreate.fieldError()).toBeTruthy();
});

test("each team member on a Team With Us proposal carries an hourly rate of at least one dollar", async ({
  surface,
}) => {
  const title = "R-2.20 opportunity bid on with an hourly rate below a dollar";
  await publishTeamOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await openProposalForm(surface, title);
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: "Full Stack Developer",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalTwuCreate.setHourlyRate({ resource: "Full Stack Developer", rate: 0 });
  await surface.proposalTwuCreate.submitProposal();

  expect(await surface.proposalTwuCreate.fieldError()).toBeTruthy();
});
