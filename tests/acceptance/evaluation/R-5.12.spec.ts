// criterion: @R-5.12 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";

// The given is an opportunity in consensus whose owner is not on its panel, and the seeded
// panel names the owner as one of its two evaluators, so the panel has to be changed before
// the walk begins. R-5.16 is the criterion that says it may be: a panel can still be changed
// while an opportunity is in individual question evaluation, which is where the seeded
// opportunity stands once its deadline has passed.
//
// The change is the smallest one that takes the owner off the panel and still leaves it
// valid and workable. The owner is removed, and the chair's part is given to a public sector
// employee who is not an evaluator, which the panel form offers as a separate choice from
// the list of evaluators. What is left is one evaluator — the administrator, who was already
// on the panel — and a chair, so the panel still names two people and individual evaluation
// can still be completed by somebody the target can sign in as.
//
// The owner then opens the consensus list. empty_for_owner_not_on_panel is the observation
// the contract writes for the page explaining itself, and a page that opened as an empty
// list with no explanation would leave it with nothing to report.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposals = [
  seed.proposals.sprintWithUsOne.id,
  seed.proposals.sprintWithUsTwo.id,
  seed.proposals.sprintWithUsThree.id,
];
const questions = [0, 1, 2, 3];

test("the consensus list tells the owner why it is withheld rather than opening empty", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationPanelSwu.open({ opportunityId });
  await surface.evaluationPanelSwu.removePanelMember({ member: seed.users.staffOne });
  await surface.evaluationPanelSwu.choosePanelChair({ member: seed.users.staffTwo });
  await surface.evaluationPanelSwu.saveEvaluationPanel();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  for (const proposalId of proposals) {
    await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
        order,
        notes: "A complete reading of this answer.",
      });
    }
    await surface.evaluationIndividualCreateSwu.saveDraft();
  }
  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationConsensusListSwu.open({ opportunityId });

  expect(await surface.evaluationConsensusListSwu.emptyForOwnerNotOnPanel()).toBeTruthy();
});
