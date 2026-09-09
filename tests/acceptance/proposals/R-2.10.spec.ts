// criterion: @R-2.10 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The opportunity carries one resource at full-time allocation over a contract period of
// two months and a maximum budget of $50,000. An hourly rate of $5,000 exhausts that
// budget many times over whatever working-day arithmetic the service uses, and a rate of
// $100 stays well inside it however generous that arithmetic is, so neither test depends
// on knowing how the total is worked out — only on the two rates falling on opposite sides
// of the line by a wide margin.
//
// The create test carries the $100 proposal as a control on a second opportunity of the
// same shape: without it a refusal could be the doing of anything on the form, and with it
// the rate is the only thing that changed.
//
// The edit path is reached by saving the over-budget proposal as a draft, which is always
// accepted (R-2.12), and then submitting it from the proposal's own management screen. The
// refusal is read as the proposal staying a draft, since that screen names no error.

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
    maxBudget: 50000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    title,
  });
  await surface.signOut();
}

async function fillTeamProposal(
  surface: Surface,
  opportunity: string,
  hourlyRate: number,
): Promise<void> {
  await surface.proposalTwuCreate.open({ opportunity });
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
  const overBudget = "R-2.10 Team With Us opportunity bid over its maximum budget";
  const withinBudget = "R-2.10 Team With Us opportunity bid within its maximum budget";
  await publishTeamOpportunity(surface, overBudget);
  await publishTeamOpportunity(surface, withinBudget);

  await surface.signIn(persona.organizationAdmin);

  await fillTeamProposal(surface, withinBudget, 100);
  await surface.proposalTwuCreate.submitProposal();
  expect(await surface.proposalTwuCreate.fieldError()).toBeFalsy();
  await surface.proposalTwuEdit.open({ opportunity: withinBudget });
  expect((await surface.proposalTwuEdit.status()).toLowerCase()).toContain("submitted");

  await fillTeamProposal(surface, overBudget, 5000);
  await surface.proposalTwuCreate.submitProposal();
  expect(await surface.proposalTwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us proposal whose hourly rates come to more than the opportunity's maximum budget is refused on the edit path", async ({
  surface,
}) => {
  const title = "R-2.10 Team With Us opportunity whose over-budget draft is submitted later";
  await publishTeamOpportunity(surface, title);

  await surface.signIn(persona.organizationAdmin);
  await fillTeamProposal(surface, title, 5000);
  await surface.proposalTwuCreate.saveDraft();

  await surface.proposalTwuEdit.open({ opportunity: title });
  expect((await surface.proposalTwuEdit.status()).toLowerCase()).toContain("draft");
  await surface.proposalTwuEdit.submitProposal();

  await surface.proposalTwuEdit.open({ opportunity: title });
  expect((await surface.proposalTwuEdit.status()).toLowerCase()).toContain("draft");
});
