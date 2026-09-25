// criterion: @R-2.15 v2
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is the seeded Code With Us opportunity whose proposal deadline passed thirty days
// ago. Its one proposal is a draft belonging to the organization owner, and the scheduled
// transition trigger is requested first so the closure the deadline brings has been applied
// before anything is asked of it.
//
// The two requests the criterion names are one test each:
//
//   - the owner of the draft submits it, and it is still a draft afterwards. The screen that
//     manages a Code With Us proposal names no observation for a refusal, so the quoted
//     message cannot be read there; the draft staying a draft is what is read.
//   - a second vendor creates a proposal already marked as submitted. Where the attempt reaches
//     the service the quoted refusal is read off the create screen; where the form will not
//     let the attempt be made at all, that is the refusal. Either way no proposal is created,
//     which is read off the vendor's own list of proposals.

const statement =
  'A proposal cannot move from draft to submitted once the opportunity\'s proposal deadline has passed, and a Code With Us proposal cannot be created already marked as submitted after that deadline, which is refused with "This opportunity is no longer accepting proposals."; the equivalent guard is absent from Sprint With Us and Team With Us creation, where the only barrier is that a closed opportunity is no longer visible to a vendor.';

const refusal = "This opportunity is no longer accepting proposals.";
const settle = { timeout: 15000 };
const opportunityId = seed.opportunities.cwuLapsedWithDraft.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function attempt(steps: Array<() => Promise<void>>): Promise<boolean> {
  try {
    for (const step of steps) await step();
    return true;
  } catch {
    return false;
  }
}

async function closeOverdueOpportunities(surface: Surface): Promise<void> {
  await surface.scheduledTransitionTrigger.open();
  await surface.scheduledTransitionTrigger.runPendingTransitions();
}

test(`${statement} (a draft submitted after the deadline)`, async ({ surface }) => {
  const proposalId = seed.proposals.cwuLapsedWithDraftDraft.id;
  await closeOverdueOpportunities(surface);

  await surface.signIn(persona.organizationOwner);
  await surface.proposalCwuEdit.open({ opportunityId, proposalId });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("draft");

  await attempt([() => surface.proposalCwuEdit.submitProposal()]);

  await surface.proposalCwuEdit.open({ opportunityId, proposalId });
  const status = (await surface.proposalCwuEdit.status()).toLowerCase();
  expect(status).toContain("draft");
  expect(status).not.toContain("submitted");
});

test(`${statement} (a proposal created already submitted after the deadline)`, async ({
  surface,
}) => {
  await closeOverdueOpportunities(surface);

  await surface.signIn(persona.vendor);
  const reachedTheService = await attempt([
    () => surface.proposalCwuCreate.open({ opportunityId }),
    () =>
      surface.proposalCwuCreate.chooseProponentIndividual({
        legalName: "Robin Vendor",
        email: "robin.vendor@example.test",
        phone: "250-555-0199",
        streetAddress: "1200 Government Street",
        city: "Victoria",
        region: "British Columbia",
        mailCode: "V8W1V1",
        country: "Canada",
      }),
    () => surface.proposalCwuCreate.acceptProgramTerms(),
    () => surface.proposalCwuCreate.acceptAppTerms(),
    () =>
      surface.proposalCwuCreate.submitProposal({
        proposalText: "A proposal offered after the proposal deadline has passed.",
      }),
  ]);

  if (reachedTheService) {
    await expect
      .poll(() => readOrEmpty(() => surface.proposalCwuCreate.fieldError()), settle)
      .toContain(refusal);
  }

  await surface.proposalVendorDashboard.open();
  await attempt([() => surface.proposalVendorDashboard.showMyProposals()]);
  const mine = await readOrEmpty(() => surface.proposalVendorDashboard.myProposalsTable());
  expect(mine).not.toContain(seed.opportunities.cwuLapsedWithDraft.title);
});
