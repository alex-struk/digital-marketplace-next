// criterion: @R-2.13 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Every test fills in the same form, complete in every other respect, and varies one thing:
// the proposal text, the additional comments, or whether a proponent was chosen at all.
// That the same form is accepted when nothing is varied is R-2.7, so a refusal here can
// only be the doing of the field the test changed.
//
// A refusal is read two ways. The proposal never reaches the vendor's own list of
// proposals, which holds in every case. And where the vendor typed something the service
// found wrong — the text or the comments — the screen raises a field error. Which field it
// names is not asserted, because the observation returns the screen's errors as one piece
// of text rather than a field and a message. With no proponent chosen the criterion
// promises only the refusal, not a reason shown against a choice nobody made, so that case
// asserts no error and accepts a submission that cannot be made at all as the refusal.

const statement =
  "A Code With Us proposal that is not a draft is rejected unless it carries proposal text of 1 to 10,000 characters, additional comments of at most 10,000 characters, and a complete proponent.";

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

// Named as R-2.14 names them, so the proponent is complete rather than whatever an empty
// choice happens to leave behind.
const completeIndividual = {
  legalName: "Robin Vendor",
  email: "robin.vendor@example.test",
  phone: "250-555-0199",
  streetAddress: "1200 Government Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8W1V1",
  country: "Canada",
};

const tooLong = "word ".repeat(2001).slice(0, 10001);

async function publishOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

async function openProposalForm(
  surface: Surface,
  opportunityId: string,
  proponent: "individual" | "none",
): Promise<void> {
  await surface.proposalCwuCreate.open({ opportunityId });
  if (proponent === "individual") {
    await surface.proposalCwuCreate.chooseProponentIndividual(completeIndividual);
  }
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
}

async function expectNoProposalOn(surface: Surface, title: string): Promise<void> {
  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(title);
}

test(`${statement} (when the proposal text is empty)`, async ({ surface }) => {
  const title = "R-2.13 opportunity bid on with no proposal text";
  const opportunityId = await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await openProposalForm(surface, opportunityId, "individual");
  await surface.proposalCwuCreate.submitProposal({ proposalText: "" });

  await expect.poll(() => surface.proposalCwuCreate.fieldError()).toBeTruthy();
  await expectNoProposalOn(surface, title);
});

test(`${statement} (when the proposal text is longer than 10,000 characters)`, async ({
  surface,
}) => {
  const title = "R-2.13 opportunity bid on with overlong proposal text";
  const opportunityId = await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await openProposalForm(surface, opportunityId, "individual");
  await surface.proposalCwuCreate.submitProposal({ proposalText: tooLong });

  await expect.poll(() => surface.proposalCwuCreate.fieldError()).toBeTruthy();
  await expectNoProposalOn(surface, title);
});

test(`${statement} (when the additional comments are longer than 10,000 characters)`, async ({
  surface,
}) => {
  const title = "R-2.13 opportunity bid on with overlong additional comments";
  const opportunityId = await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await openProposalForm(surface, opportunityId, "individual");
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal whose text is the right length and whose comments are not.",
    additionalComments: tooLong,
  });

  await expect.poll(() => surface.proposalCwuCreate.fieldError()).toBeTruthy();
  await expectNoProposalOn(surface, title);
});

test(`${statement} (when it carries no complete proponent)`, async ({ surface }) => {
  const title = "R-2.13 opportunity bid on with no proponent";
  const opportunityId = await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await openProposalForm(surface, opportunityId, "none");

  // A submission the screen will not let the vendor make is the refusal, so an action that
  // cannot be carried out is not a failure of this test; what was submitted is.
  await surface.proposalCwuCreate
    .submitProposal({ proposalText: "A proposal offered without saying who is offering it." })
    .catch(() => undefined);

  await expectNoProposalOn(surface, title);
});
