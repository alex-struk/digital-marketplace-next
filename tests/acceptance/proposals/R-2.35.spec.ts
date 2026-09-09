// criterion: @R-2.35 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The proposal is walked through the three changes of state the surface can bring about —
// saved as a draft, submitted, withdrawn — and the history is read after each one. Every
// change both adds to the history and leaves the state it caused named there, which is what
// "every change of state is recorded" means from outside.
//
// Two parts of the criterion are left alone. The scores entered against a proposal are one:
// scoring needs the opportunity to have closed, and no page, action or observation closes
// one (see R-1.1). Who made each change is the other: the observation returns the history
// as one piece of text, and no person the suite can sign in as carries a display name in
// the seed for that text to be matched against.

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

async function publishOpportunity(surface: Surface, title: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  await surface.signOut();
}

test("every change of state against a proposal is recorded in its history", async ({ surface }) => {
  const title = "R-2.35 opportunity whose proposal is walked through three states";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({
    proposalText: "A proposal whose history is read after every change of state.",
  });

  await surface.proposalCwuView.open({ opportunity: title });
  const afterDraft = await surface.proposalCwuView.historyTab();
  expect(afterDraft).toBeTruthy();

  await surface.proposalCwuEdit.open({ opportunity: title });
  await surface.proposalCwuEdit.submitProposal();
  await surface.proposalCwuView.open({ opportunity: title });
  const afterSubmission = await surface.proposalCwuView.historyTab();
  expect(afterSubmission).not.toBe(afterDraft);
  expect(afterSubmission.toLowerCase()).toContain("submitted");

  await surface.proposalCwuEdit.open({ opportunity: title });
  await surface.proposalCwuEdit.withdrawProposal();
  await surface.proposalCwuView.open({ opportunity: title });
  const afterWithdrawal = await surface.proposalCwuView.historyTab();
  expect(afterWithdrawal).not.toBe(afterSubmission);
  expect(afterWithdrawal.toLowerCase()).toContain("withdrawn");
  expect(afterWithdrawal.toLowerCase()).toContain("submitted");
});
