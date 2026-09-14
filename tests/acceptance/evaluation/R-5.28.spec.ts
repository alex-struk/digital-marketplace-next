// criterion: @R-5.28 v2
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-13
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Both evaluators score every proponent and submit, which is what carries the opportunity
// into consensus. The reader is then the public sector employee on the panel, who is not an
// administrator, so the read cannot be explained by the administrator's own access. They
// open one proponent's consensus form, which is where the contract puts
// panel_member_score and panel_member_notes, and which R-5.29 has an evaluator who is not
// the chair reach. The two evaluators wrote different comments, and the notes are asserted
// to carry the other evaluator's, so a form showing only the reader's own work fails.
//
// That reader is also the opportunity's owner, because the seeded panel is built from the
// two public sector sign-ins the target has; the criterion gives the owner no access of
// their own to individual evaluations, so it is as a panel member that they read.
//
// Three parts of the criterion are out of reach and are not asserted.
//
// The "before then" half — that no one but the writer may read an evaluation while the
// opportunity is still in individual evaluation — has no observation. The individual edit
// surface reports an evaluation's status, whether it is read-only and the two field errors,
// and nothing that tells a refusal from a blank form, so a panel member asking for another's
// scores too early cannot be told from one who asked for nothing.
//
// The administrator half needs an administrator who is not on the panel. The target mints a
// session for one administrator, and the seeded panel makes that person its chair.
//
// The last clause — that a consensus may be read by an administrator at any stage — needs
// the same unconnected administrator.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposals = [
  seed.proposals.sprintWithUsOne.id,
  seed.proposals.sprintWithUsTwo.id,
  seed.proposals.sprintWithUsThree.id,
];
const questions = [0, 1, 2, 3];

async function scoreEveryProponent(surface: Surface, score: number): Promise<void> {
  for (const proposalId of proposals) {
    await surface.evaluationIndividualCreateSwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationIndividualCreateSwu.enterQuestionScore({ order, score });
      await surface.evaluationIndividualCreateSwu.enterQuestionNotes({
        order,
        notes: `A reading of this answer that ends at ${score} out of five.`,
      });
    }
    await surface.evaluationIndividualCreateSwu.saveDraft();
  }
  await surface.evaluationIndividualListSwu.open({ opportunityId });
  await surface.evaluationIndividualListSwu.submitScoresForConsensus();
}

test("once an opportunity reaches consensus every panel member can read every evaluator's individual scores and comments", async ({
  surface,
}) => {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface, 3);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface, 5);
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.evaluationConsensusCreateSwu.open({
    opportunityId,
    proposalId: seed.proposals.sprintWithUsOne.id,
  });

  expect(await surface.evaluationConsensusCreateSwu.panelMemberScore()).toBeTruthy();
  expect(await surface.evaluationConsensusCreateSwu.panelMemberNotes()).toContain(
    "A reading of this answer that ends at 5 out of five.",
  );
});
