// criterion: @R-5.35 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const TITLE = "R-5.35 Sprint With Us opportunity with two proponents";
const QUESTION = "Describe how your team would run the first sprint.";

function momentsFromNow(): string {
  return new Date(Date.now() + 10_000).toISOString();
}

// Only one seeded organization is qualified for Sprint With Us, and this criterion needs
// two proponents, so a second seeded organization is brought up to the qualification
// through its own pages before it can propose.
async function qualifyASecondOrganization(surface: Surface) {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ organization: seed.organizations.withPendingInvitation.id });
  await surface.organizationEdit.addTeamMembers({
    members: [seed.users.organizationAdmin, seed.users.organizationMember],
  });
  await surface.organizationEdit.viewSwuTerms();
  await surface.organizationSwuTerms.acceptTerms();
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.organizationUserMemberships.open();
  await surface.organizationUserMemberships.approveInvitation({ organization: seed.organizations.withPendingInvitation });
  await surface.signOut();

  await surface.signIn(persona.organizationMember);
  await surface.organizationUserMemberships.open();
  await surface.organizationUserMemberships.approveInvitation({ organization: seed.organizations.withPendingInvitation });
  await surface.signOut();
}

async function anOpportunityWithTwoProponents(surface: Surface) {
  await qualifyASecondOrganization(surface);

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityProgramSelect.open();
  await surface.opportunityProgramSelect.chooseSprintWithUs();
  await surface.opportunitySwuCreate.addPhase({ phase: "implementation" });
  await surface.opportunitySwuCreate.addTeamQuestion({ question: QUESTION, maximumScore: 5, minimumScore: 1 });
  await surface.opportunitySwuCreate.setEvaluationPanel({
    evaluators: [seed.users.staffPanelEvaluator],
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

  await surface.signIn(persona.organizationOwner);
  await surface.opportunitySwuView.open({ title: TITLE });
  await surface.opportunitySwuView.startProposal();
  await surface.proposalSwuCreate.chooseOrganization({ organization: seed.organizations.withPendingInvitation });
  await surface.proposalSwuCreate.addPhaseTeamMember({ phase: "implementation", member: seed.users.organizationMember });
  await surface.proposalSwuCreate.setScrumMaster({ member: seed.users.organizationAdmin });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "implementation", cost: 60000 });
  await surface.proposalSwuCreate.answerTeamQuestion({ question: QUESTION, answer: "We start by mapping the service." });
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
}

test("an evaluator works through the proponents one after another in anonymous-proponent order, saving as they move between them", async ({ surface }) => {
  await anOpportunityWithTwoProponents(surface);

  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  const rows = await surface.evaluationIndividualListSwu.proponentRow();
  const first = await surface.evaluationIndividualListSwu.anonymousProponentName();

  await surface.evaluationIndividualListSwu.openProponentEvaluation({ proponent: first });
  await surface.evaluationIndividualCreateSwu.enterQuestionScore({ question: QUESTION, score: 4 });
  await surface.evaluationIndividualCreateSwu.enterQuestionNotes({ question: QUESTION, notes: "A clear plan." });
  await surface.evaluationIndividualCreateSwu.saveAndGoToNextProponent();

  const second = await surface.evaluationIndividualCreateSwu.anonymousProponentName();
  expect(second).not.toBe(first);
  expect(first.localeCompare(second)).toBeLessThan(0);
  expect(rows.indexOf(first)).toBeLessThan(rows.indexOf(second));

  await surface.evaluationIndividualListSwu.open({ title: TITLE });
  expect(await surface.evaluationIndividualListSwu.evaluationStatus()).toMatch(/draft/i);
});
