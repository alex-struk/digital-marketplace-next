// criterion: @R-2.28 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";
const CAPABILITY = seed.users.organizationOwner.capabilities[0];
const SERVICE_AREA = seed.organizations.qualified.service_areas[0];
const WRONG_STAGE =
  "The opportunity is not in the correct stage of evaluation to perform that action.";

const references = [1, 2, 3].map((order) => ({
  order,
  name: `Reference ${order}`,
  company: `Referring Company ${order}`,
  phone: "250 555 0100",
  email: `reference.${order}@example.test`,
}));

// A Sprint With Us opportunity that has just closed: its proposals are under review on
// the team questions, which is the first of its evaluation stages.
async function closedSprintWithUsOpportunity(surface: Surface, title: string) {
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

  await surface.signIn(persona.organizationOwner);
  await surface.proposalSwuCreate.open({ opportunityTitle: title });
  await surface.proposalSwuCreate.chooseOrganization(seed.organizations.qualified);
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
  await surface.proposalSwuCreate.submitProposal();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ opportunityTitle: title });
  await surface.opportunitySwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();
}

test("a Sprint With Us action taken at the wrong stage of the opportunity is refused", async ({
  surface,
}) => {
  const title = "R-2.28 a team scenario score entered too early";
  await closedSprintWithUsOpportunity(surface, title);

  await surface.signIn(persona.administrator);
  await surface.proposalSwuView.open({ opportunityTitle: title, proponent: "Proponent 1" });
  // The opportunity is still reviewing its team questions; the team scenario is two
  // stages further on.
  await surface.proposalSwuView.scoreTeamScenario({ score: 80 });

  expect(await surface.proposalSwuView.wrongStageError()).toContain(WRONG_STAGE);
  expect(await surface.proposalSwuView.scenarioScore()).toBeFalsy();
});

test("Sprint With Us proposals advance through the evaluation stages one at a time", async ({
  surface,
}) => {
  const title = "R-2.28 stages are taken in turn";
  await closedSprintWithUsOpportunity(surface, title);

  await surface.signIn(persona.administrator);
  await surface.proposalSwuView.open({ opportunityTitle: title, proponent: "Proponent 1" });

  // Screening into the team scenario belongs to the code challenge stage, which this
  // opportunity has not reached either.
  await surface.proposalSwuView.screenInToTeamScenario();
  expect(await surface.proposalSwuView.wrongStageError()).toContain(WRONG_STAGE);
});

test("a Team With Us action taken at the wrong stage of the opportunity is refused", async ({
  surface,
}) => {
  const title = "R-2.28 a challenge score entered too early";

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

  await surface.signIn(persona.organizationOwner);
  await surface.proposalTwuCreate.open({ opportunityTitle: title });
  await surface.proposalTwuCreate.chooseOrganization(seed.organizations.qualified);
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: 1,
    member: seed.users.organizationOwner,
  });
  await surface.proposalTwuCreate.setHourlyRate({
    resource: 1,
    member: seed.users.organizationOwner,
    hourlyRate: 50,
  });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 1,
    response: "We would staff it with the person named above.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.submitProposal();

  await surface.signIn(persona.administrator);
  await surface.opportunityTwuEdit.open({ opportunityTitle: title });
  await surface.opportunityTwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  await surface.opportunityList.open();

  await surface.proposalTwuView.open({ opportunityTitle: title, proponent: "Proponent 1" });
  await surface.proposalTwuView.scoreChallenge({ score: 80 });

  expect(await surface.proposalTwuView.wrongStageError()).toContain(WRONG_STAGE);
});
