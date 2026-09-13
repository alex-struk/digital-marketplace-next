// criterion: @R-2.36 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The catcher is cleared immediately before the act each test is about, so that what turns
// up afterwards can only have been sent by that act — the withdrawal test in particular
// would otherwise still be holding the submission's own confirmation.
//
// The middle of the criterion — an award notice to the winner and a decision notice to
// everyone else — is not asserted. Only a fully evaluated proposal may be awarded, and the
// surface cannot carry one that far: see the entries for R-2.33 and R-2.30 in
// not-testable.yaml.

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

test("submitting a proposal sends a confirmation to the submitting vendor", async ({
  surface,
  mail,
}) => {
  const opportunityId = await publishOpportunity(
    surface,
    "R-2.36 opportunity whose submission is confirmed by email",
  );

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();

  await mail.clear();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal whose submission the vendor is written to about.",
  });

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);
});

test("withdrawing a proposal sends a notice to the vendor and to every administrator", async ({
  surface,
  mail,
}) => {
  const opportunityId = await publishOpportunity(
    surface,
    "R-2.36 opportunity whose withdrawal is written about",
  );

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal the vendor later takes back.",
  });

  await mail.clear();
  await surface.proposalCwuEdit.withdrawProposal();

  await expect
    .poll(async () => (await mail.messagesTo(seed.users.vendorOne.email)).length, { timeout: 10000 })
    .toBeGreaterThan(0);
  await expect
    .poll(async () => (await mail.messagesTo(seed.users.administratorOne.email)).length, {
      timeout: 10000,
    })
    .toBeGreaterThan(0);
});
