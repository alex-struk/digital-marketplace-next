// criterion: @R-2.2 v2
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The vendor's first proposal is left as a draft. The criterion says a proposal in any state
// stands in the way of a second one, and a draft is the state most easily mistaken for
// "not really a proposal yet".
//
// Starting a second proposal is the opportunity page's own start_proposal, which is how a
// vendor starts one. Being taken to the proposal they already hold is read as the screen
// they land on carrying that proposal's identifier and its text. That no second proposal was
// made is read from the vendor's own dashboard, which lists the opportunity once.
//
// The middle clause — a request to create a second one being refused with a message saying
// they already have one — is not asserted. Once starting a proposal leads to the one already
// held, no screen in the surface puts a create form in front of the vendor to send that
// request from, and proposal-cwu-create names no action that sends a create request on its
// own. Its field_error has nothing to report until something reaches the service with that
// request.

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

function occurrences(text: string, of: string): number {
  return text.split(of).length - 1;
}

test("a vendor who starts a second proposal against an opportunity they already have a proposal for is taken to the proposal they already hold instead of a new one, and no second proposal is created", async ({
  surface,
}) => {
  const title = "R-2.2 opportunity a vendor starts a second proposal against";
  const opportunityId = await publishOpportunity(surface, title);
  const firstText = "The one proposal this vendor holds against the opportunity.";

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({ proposalText: firstText });
  const proposalId = await surface.proposalCwuEdit.proposalIdentifier();

  await surface.opportunityCwuView.open({ opportunityId });
  await surface.opportunityCwuView.startProposal();

  expect(await surface.proposalCwuEdit.proposalIdentifier()).toBe(proposalId);
  expect(await surface.proposalCwuEdit.proposalTab()).toContain(firstText);

  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(occurrences(await surface.proposalVendorDashboard.myProposalsTable(), title)).toBe(1);
});
