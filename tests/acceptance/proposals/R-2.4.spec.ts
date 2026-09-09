// criterion: @R-2.4 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The refusal is read as the submitted proposal still being there afterwards, still
// submitted, rather than as a message: the proposal management screen names no refusal
// observation, and a deletion that did not happen is exactly a proposal that survives.
//
// "Permanently" is read the only way a person could read it — the proposal can no longer
// be opened, and no longer appears among the vendor's own proposals on their dashboard.

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

test("a proposal that has been submitted cannot be deleted", async ({ surface }) => {
  const title = "R-2.4 opportunity carrying a submitted proposal";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A submitted proposal its author then asks to have deleted.",
  });

  await surface.proposalCwuEdit.open({ opportunity: title });
  await surface.proposalCwuEdit.deleteProposal();

  await surface.proposalCwuEdit.open({ opportunity: title });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("submitted");
});

test("only a draft proposal can be deleted, and deleting it removes it permanently", async ({
  surface,
}) => {
  const title = "R-2.4 opportunity carrying a draft proposal that is deleted";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({
    proposalText: "A draft proposal its author then deletes.",
  });

  await surface.proposalCwuEdit.open({ opportunity: title });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("draft");
  await surface.proposalCwuEdit.deleteProposal();

  await surface.proposalCwuEdit.open({ opportunity: title });
  expect(await surface.proposalCwuEdit.proposalTab()).toBeFalsy();

  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(title);
});
