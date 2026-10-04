// criterion: @R-2.2 v2
// provenance: blind, spec@658792c3c7c79540af12cf18a97a260fc2484f16, derived 2026-10-04
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// In each test the vendor's first proposal is left as a draft. The criterion says a proposal
// in any state stands in the way of a second one, and a draft is the state most easily
// mistaken for "not really a proposal yet". Each test publishes its own opportunity, still
// accepting proposals, so no earlier proposal by the same vendor is in the way.
//
// Starting a second proposal is the opportunity page's own start_proposal, which is how a
// vendor starts one. Being taken to the proposal they already hold is read as the screen
// they land on carrying that proposal's identifier and its text.
//
// The screens never send a second create request, so the request is sent through
// proposal-cwu-request, with an individual proponent (an organization proponent would be
// refused first for its organization) and a Draft status (a valid status, so the request
// is not refused for its status before the service looks for the proposal already held).
//
// That no second proposal was made is read, after either attempt, from the vendor's own
// dashboard, which lists the opportunity once.

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

const individual = {
  legalName: "Robin Vendor",
  email: "robin.vendor@example.test",
  phone: "250-555-0199",
  street1: "1200 Government Street",
  street2: "",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8W1V1",
  country: "Canada",
};

const settle = { timeout: 20000 };
const firstText = "The one proposal this vendor holds against the opportunity.";

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function publishOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

async function holdDraftProposal(surface: Surface, opportunityId: string): Promise<string> {
  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({ proposalText: firstText });
  return surface.proposalCwuEdit.proposalIdentifier();
}

async function expectListedOnce(surface: Surface, title: string): Promise<void> {
  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  const table = await surface.proposalVendorDashboard.myProposalsTable();
  expect(table.split(title).length - 1).toBe(1);
}

test("a vendor who starts a second proposal against an opportunity they already have a proposal for is taken to the proposal they already hold instead of a new one, and no second proposal is created", async ({
  surface,
}) => {
  const title = "R-2.2 opportunity a vendor starts a second proposal against";
  const opportunityId = await publishOpportunity(surface, title);
  const proposalId = await holdDraftProposal(surface, opportunityId);

  await surface.opportunityCwuView.open({ opportunityId });
  await surface.opportunityCwuView.startProposal();

  expect(await surface.proposalCwuEdit.proposalIdentifier()).toBe(proposalId);
  expect(await surface.proposalCwuEdit.proposalTab()).toContain(firstText);

  await expectListedOnce(surface, title);
});

test("a request to create a second proposal against an opportunity the vendor already has a proposal for is refused with a message saying they already have one, and no second proposal is created", async ({
  surface,
}) => {
  const title = "R-2.2 opportunity a vendor requests a second proposal against";
  const opportunityId = await publishOpportunity(surface, title);
  await holdDraftProposal(surface, opportunityId);

  await surface.proposalCwuRequest.open();
  await surface.proposalCwuRequest.submitWithIndividualProponent({
    opportunityId,
    status: "Draft",
    proposalText: "A second proposal against the same opportunity.",
    additionalComments: "None.",
    ...individual,
  });

  await expect
    .poll(() => readOrEmpty(() => surface.proposalCwuRequest.refusalStatus()), settle)
    .toBeTruthy();
  expect(await readOrEmpty(() => surface.proposalCwuRequest.requestAccepted())).toBeFalsy();
  expect(await surface.proposalCwuRequest.refusalMessages()).toContain(
    "You already have a proposal for this opportunity.",
  );

  await expectListedOnce(surface, title);
});
