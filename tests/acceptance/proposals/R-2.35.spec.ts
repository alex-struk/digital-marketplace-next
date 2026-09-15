// criterion: @R-2.35 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given — a proposal submitted, reviewed and scored — is built on the seeded Sprint With
// Us opportunity, whose first proposal is seeded as submitted and is put under review by the
// service's own closing hook. The panel then scores and agrees every proponent's questions
// and the agreed scores are finalised, which enters the question score and moves the
// proposal to the code challenge. The administrator enters a code challenge score, and
// finally disqualifies the proposal with a written reason, so that the newest entry is a
// change of state carrying a note the test wrote and can look for.
//
// The target is put back to its seed before every test, so walking the seeded opportunity
// this far leaves nothing changed for any other test.
//
// The history is read by the administrator, who is entitled to see it and who made the last
// two entries. The administrator's name is read off their own profile rather than written
// down here. "When" is read as the history carrying the current year, since the entries this
// test causes are made today; the observation returns the history as one piece of text, so
// no finer reading of each entry's time is available. "Newest first" is read as the note on
// the disqualification, the newest entry, standing ahead of the code challenge and of the
// submission, the oldest.

const opportunityId = seed.opportunities.closedSprintWithUs.id;
const proposals = [
  seed.proposals.sprintWithUsOne.id,
  seed.proposals.sprintWithUsTwo.id,
  seed.proposals.sprintWithUsThree.id,
];
const questions = [0, 1, 2, 3];
const where = { opportunityId, proposalId: seed.proposals.sprintWithUsOne.id };

async function closeOverdueOpportunities(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

async function scoreEveryProponent(surface: Surface): Promise<void> {
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
}

async function agreeAndFinaliseEveryProponent(surface: Surface): Promise<void> {
  for (const proposalId of proposals) {
    await surface.evaluationConsensusCreateSwu.open({ opportunityId, proposalId });
    for (const order of questions) {
      await surface.evaluationConsensusCreateSwu.enterQuestionScore({ order, score: 5 });
      await surface.evaluationConsensusCreateSwu.enterQuestionNotes({
        order,
        notes: "The panel agreed on this score for this answer.",
      });
    }
    await surface.evaluationConsensusCreateSwu.saveDraft();
  }
  await surface.evaluationConsensusListSwu.open({ opportunityId });
  await surface.evaluationConsensusListSwu.submitFinalConsensusScores();
  await surface.evaluationConsensusListSwu.confirmSubmitConsensus();
  await surface.evaluationConsensusListSwu.finalizeConsensusScores();
  await surface.evaluationConsensusListSwu.confirmFinalizeConsensus();
}

test("every change of state and every score entered against a proposal is recorded in its history with who did it, when, and any note given", async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  await surface.signIn(persona.publicSectorStaff);
  await scoreEveryProponent(surface);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await scoreEveryProponent(surface);
  await agreeAndFinaliseEveryProponent(surface);

  await surface.userProfileSelf.open();
  const administratorName = await surface.userProfileSelf.nameField();
  expect(administratorName).toBeTruthy();

  await surface.proposalSwuView.open(where);
  await surface.proposalSwuView.scoreCodeChallenge({ score: 80 });

  const reason = "R-2.35 the proponent's named team is no longer available.";
  await surface.proposalSwuView.open(where);
  await surface.proposalSwuView.disqualifyProposal({ reason });

  await surface.proposalSwuView.open(where);
  const history = await surface.proposalSwuView.historyTab();
  const lower = history.toLowerCase();

  expect(lower).toContain("submitted");
  expect(lower).toContain("review");
  expect(lower).toContain("code challenge");
  expect(history).toContain("80");
  expect(lower).toContain("disqualif");

  expect(history).toContain(reason);
  expect(history).toContain(administratorName);
  expect(history).toContain(String(new Date().getFullYear()));

  expect(history.indexOf(reason)).toBeLessThan(lower.lastIndexOf("code challenge"));
  expect(lower.lastIndexOf("code challenge")).toBeLessThan(lower.lastIndexOf("submitted"));
});
