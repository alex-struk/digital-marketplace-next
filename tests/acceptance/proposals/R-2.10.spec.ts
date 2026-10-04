// criterion: @R-2.10 v1
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-04
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The opportunity carries one resource at full-time allocation over a contract period of
// two months and a maximum budget of $50,000. An hourly rate of $5,000 exhausts that
// budget many times over whatever working-day arithmetic the service uses, and a rate of
// $100 stays well inside it however generous that arithmetic is, so the test does not
// depend on knowing how the total is worked out — only on the two rates falling on
// opposite sides of the line by a wide margin.
//
// The $100 proposal is a control on a second opportunity of the same shape: without it a
// refusal could be the doing of anything on the form, and with it the rate is the only
// thing that changed.
//
// The edit-path clause has no test here. It has to start from a proposal saved within
// budget whose rates are then edited over it, and the Team With Us proposal management
// screen offers no control for the hourly rate; that clause is recorded against this
// criterion in not-testable.yaml.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishTeamOpportunity(surface: Surface, title: string): Promise<string> {
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
    maxBudget: 50000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    title,
  });
  const opportunityId = await surface.opportunityTwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

async function fillTeamProposal(
  surface: Surface,
  opportunityId: string,
  hourlyRate: number,
): Promise<void> {
  await surface.proposalTwuCreate.open({ opportunityId });
  await surface.proposalTwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: "Full Stack Developer",
    member: seed.users.organizationAdmin,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: "Full Stack Developer",
    rate: hourlyRate,
  });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 0,
    response: "Our developer built and ran the same kind of service for a Crown corporation.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
}

test("a Team With Us proposal whose hourly rates come to more than the opportunity's maximum budget is refused on the create path", async ({
  surface,
}) => {
  const overBudget = await publishTeamOpportunity(
    surface,
    "R-2.10 Team With Us opportunity bid over its maximum budget",
  );
  const withinBudget = await publishTeamOpportunity(
    surface,
    "R-2.10 Team With Us opportunity bid within its maximum budget",
  );

  await surface.signIn(persona.organizationAdmin);

  await fillTeamProposal(surface, withinBudget, 100);
  await surface.proposalTwuCreate.submitProposal();
  expect(await surface.proposalTwuCreate.fieldError()).toBeFalsy();
  expect((await surface.proposalTwuEdit.status()).toLowerCase()).toContain("submitted");

  await fillTeamProposal(surface, overBudget, 5000);
  await surface.proposalTwuCreate.submitProposal();
  expect(await surface.proposalTwuCreate.fieldError()).toBeTruthy();
});
