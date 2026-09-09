// criterion: @R-2.36 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The catcher is cleared immediately before the act each test is about, so that what turns
// up afterwards can only have been sent by that act — the withdrawal test in particular
// would otherwise still be holding the submission's own confirmation.
//
// The middle of the criterion — an award notice to the winner and a decision notice to
// everyone else — is not asserted. Awarding needs an opportunity that has closed and been
// evaluated, and no page, action or observation closes an opportunity (see R-1.1), so there
// is no award for either notice to follow.

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

test("submitting a proposal sends a confirmation to the submitting vendor", async ({
  surface,
  mail,
}) => {
  const title = "R-2.36 opportunity whose submission is confirmed by email";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
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
  const title = "R-2.36 opportunity whose withdrawal is written about";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal the vendor later takes back.",
  });

  await surface.proposalCwuEdit.open({ opportunity: title });
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
