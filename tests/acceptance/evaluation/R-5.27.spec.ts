// criterion: @R-5.27 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface, Persona } from "../../fixtures";

const TITLE = "R-5.27 Sprint With Us opportunity with two evaluators";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

// Two evaluators, one separate chair, one proponent and one question: the count the
// service waits for is two submitted scores.
async function anOpportunityInIndividualEvaluation(surface: Surface): Promise<string> {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.addPhase({ phase: "implementation" });
  await surface.opportunitySwuCreate.addTeamQuestion({ question: QUESTION, maximumScore: 5, minimumScore: 1 });
  await surface.opportunitySwuCreate.setEvaluationPanel({
    evaluators: [seed.users.staffPanelEvaluator, seed.users.administratorOne],
    chair: seed.users.staffPanelChair,
  });
  await surface.opportunitySwuCreate.saveDraft({ title: TITLE, proposalDeadline: momentsFromNow() });
  await surface.opportunitySwuEdit.open({ title: TITLE });
  await surface.opportunitySwuEdit.submitForReview();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ title: TITLE });
  await surface.opportunitySwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.opportunitySwuView.open({ title: TITLE });
  await surface.opportunitySwuView.startProposal();
  await surface.proposalSwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "implementation", member: seed.users.organizationMember });
  await surface.proposalSwuCreate.setScrumMaster({ member: seed.users.organizationOwner });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "implementation", cost: 50000 });
  await surface.proposalSwuCreate.answerTeamQuestion({ question: QUESTION, answer: "We start with a discovery sprint." });
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
  await surface.proposalSwuCreate.submitProposal();
  await surface.signOut();

  await surface.signIn(persona.evaluationPanelEvaluator);
  await expect
    .poll(async () => {
      await surface.opportunitySwuView.open({ title: TITLE });
      return surface.opportunitySwuView.status();
    }, { timeout: 20_000 })
    .toMatch(/evaluation/i);
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  const proponent = await surface.evaluationIndividualListSwu.anonymousProponentName();
  await surface.signOut();
  return proponent;
}

async function scoreAndSubmitAs(surface: Surface, who: Persona, proponent: string, score: number) {
  await surface.signIn(who);
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.openProponentEvaluation({ proponent });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: QUESTION, score });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "A clear plan." });
  await surface.evaluationIndividualCreateSwu.saveDraft();
  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  await surface.signOut();
}

test("an opportunity moves from individual evaluation to consensus by itself once the submitted individual scores number one per question per proponent per evaluator", async ({ surface }) => {
  const proponent = await anOpportunityInIndividualEvaluation(surface);

  await scoreAndSubmitAs(surface, persona.evaluationPanelEvaluator, proponent, 4);

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuView.open({ title: TITLE });
  expect(await surface.opportunitySwuView.status()).not.toMatch(/consensus/i);
  await surface.signOut();

  await scoreAndSubmitAs(surface, persona.administrator, proponent, 3);

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuView.open({ title: TITLE });
  expect(await surface.opportunitySwuView.status()).toMatch(/consensus/i);
});

test("the chair and the opportunity's owner are then told it is ready", async ({ surface, mail }) => {
  const proponent = await anOpportunityInIndividualEvaluation(surface);

  await scoreAndSubmitAs(surface, persona.evaluationPanelEvaluator, proponent, 4);
  await mail.clear();
  await scoreAndSubmitAs(surface, persona.administrator, proponent, 3);

  expect(await mail.messagesTo(seed.users.staffPanelChair.email)).not.toHaveLength(0);
  expect(await mail.messagesTo(seed.users.staffOne.email)).not.toHaveLength(0);
});
