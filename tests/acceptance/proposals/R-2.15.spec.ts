// criterion: @R-2.15 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";
const NO_LONGER_ACCEPTING = "This opportunity is no longer accepting proposals.";
const SERVICE_AREA = seed.organizations.qualified.service_areas[0];

const individualProponent = {
  legalName: "Robin Fielder",
  email: "robin.fielder@example.test",
  street1: "1 Front Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V 1V1",
  country: "Canada",
};

async function publishCodeWithUsOpportunity(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    reward: 5000,
    proposalDeadline: FUTURE_DEADLINE,
    remoteOk: true,
  });
}

async function letTheDeadlinePass(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  await surface.opportunityCwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();
}

test("a proposal cannot move from draft to submitted once the opportunity's proposal deadline has passed", async ({
  surface,
}) => {
  const title = "R-2.15 draft after the deadline";
  await publishCodeWithUsOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
  await surface.proposalCwuCreate.saveDraft({
    proposalText: "How we would do the work.",
    additionalComments: "Nothing further.",
  });

  await letTheDeadlinePass(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuEdit.open({ opportunityTitle: title });
  await expect(surface.proposalCwuEdit.submitProposal()).rejects.toThrow(NO_LONGER_ACCEPTING);
  expect(await surface.proposalCwuEdit.status()).toContain("Draft");
});

test("a Code With Us proposal cannot be created already marked as submitted after the proposal deadline has passed", async ({
  surface,
}) => {
  const title = "R-2.15 submitted on creation after the deadline";
  await publishCodeWithUsOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();

  await letTheDeadlinePass(surface, title);

  await surface.signIn(persona.vendor);
  await expect(
    surface.proposalCwuCreate.open({ opportunityTitle: title })
  ).rejects.toThrow(NO_LONGER_ACCEPTING);
});

test("Sprint With Us and Team With Us creation carries no equivalent guard: a closed opportunity is simply no longer visible to a vendor", async ({
  surface,
}) => {
  const title = "R-2.15 Team With Us after the deadline";

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    order: 1,
    serviceArea: SERVICE_AREA,
    targetAllocation: 100,
  });
  await surface.opportunityTwuCreate.addResourceQuestion({
    order: 1,
    question: "How would you staff this work?",
    wordLimit: 300,
    minimumScore: 1,
    score: 100,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel({
    members: [persona.evaluationPanelEvaluator, persona.evaluationPanelChair],
    chair: persona.evaluationPanelChair,
  });
  await surface.opportunityTwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    maxBudget: 200000,
    startDate: "2030-07-01",
    completionDate: "2030-12-31",
    proposalDeadline: FUTURE_DEADLINE,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
  });

  await surface.opportunityTwuEdit.open({ opportunityTitle: title });
  await surface.opportunityTwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  await surface.opportunityList.open();

  await surface.signIn(persona.organizationOwner);
  await surface.opportunityList.open();
  expect(await surface.opportunityList.openGroup()).not.toContain(title);
  expect(await surface.opportunityList.closedGroup()).toContain(title);

  await expect(surface.proposalTwuCreate.open({ opportunityTitle: title })).rejects.toThrow();
});
