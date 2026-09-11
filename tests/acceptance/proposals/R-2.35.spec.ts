// criterion: @R-2.35 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The proposal is walked through the three changes of state the surface can bring about on
// an opportunity a test can build — saved as a draft, submitted, withdrawn — and the history
// is read after each one. Every change both adds to the history and leaves the state it
// caused named there, which is what "every change of state is recorded" means from outside.
//
// Two parts of the criterion are left alone. The scores entered against a proposal are one:
// a score is entered at an evaluation stage the surface cannot put an opportunity into (see
// the entries for R-2.26 and R-2.29 through R-2.33 in not-testable.yaml). Who made each
// change is the other: the observation returns the history as one piece of text, and no
// person the suite can sign in as carries a display name in the seed for that text to be
// matched against.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const details = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(35),
};

async function publishOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

test("every change of state against a proposal is recorded in its history", async ({ surface }) => {
  const opportunityId = await publishOpportunity(
    surface,
    "R-2.35 opportunity whose proposal is walked through three states",
  );

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({
    proposalText: "A proposal whose history is read after every change of state.",
  });
  const proposalId = await surface.proposalCwuEdit.proposalIdentifier();

  await surface.proposalCwuView.open({ opportunityId, proposalId });
  const afterDraft = await surface.proposalCwuView.historyTab();
  expect(afterDraft).toBeTruthy();

  await surface.proposalCwuEdit.open({ opportunityId, proposalId });
  await surface.proposalCwuEdit.submitProposal();
  await surface.proposalCwuView.open({ opportunityId, proposalId });
  const afterSubmission = await surface.proposalCwuView.historyTab();
  expect(afterSubmission).not.toBe(afterDraft);
  expect(afterSubmission.toLowerCase()).toContain("submitted");

  await surface.proposalCwuEdit.open({ opportunityId, proposalId });
  await surface.proposalCwuEdit.withdrawProposal();
  await surface.proposalCwuView.open({ opportunityId, proposalId });
  const afterWithdrawal = await surface.proposalCwuView.historyTab();
  expect(afterWithdrawal).not.toBe(afterSubmission);
  expect(afterWithdrawal.toLowerCase()).toContain("withdrawn");
  expect(afterWithdrawal.toLowerCase()).toContain("submitted");
});
