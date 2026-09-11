// criterion: @R-2.23 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion's given is an opportunity whose deadline has passed, and the half of the
// claim that depends on it — that a withdrawn proposal cannot be put back in once the
// opportunity has stopped accepting proposals — is not asserted. An opportunity past its
// deadline exists in the seed, but its three submitted proposals are the ones every
// criterion behind the closure is measured on, and withdrawing one takes it out of the
// evaluation for good: the re-submission the criterion says is refused is exactly what
// would have put it back. A seeded closed opportunity carrying a proposal that exists to be
// withdrawn would settle it; on what is there now, the test would cost more than it tells.
//
// What is left is the two things the criterion says happen while the opportunity is still
// open, which is the state every opportunity a test can build is in.

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

async function submitProposal(surface: Surface, opportunityId: string): Promise<string> {
  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal its author later takes back.",
  });
  return surface.proposalCwuEdit.proposalIdentifier();
}

test("a vendor may withdraw a submitted proposal", async ({ surface }) => {
  const opportunityId = await publishOpportunity(
    surface,
    "R-2.23 opportunity whose proposal is withdrawn",
  );
  const proposalId = await submitProposal(surface, opportunityId);

  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("submitted");

  await surface.proposalCwuEdit.withdrawProposal();

  await surface.proposalCwuEdit.open({ opportunityId, proposalId });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("withdrawn");
});

test("a vendor may put a withdrawn proposal back in while the opportunity is still accepting proposals", async ({
  surface,
}) => {
  const opportunityId = await publishOpportunity(
    surface,
    "R-2.23 opportunity whose withdrawn proposal is put back in",
  );
  const proposalId = await submitProposal(surface, opportunityId);

  await surface.proposalCwuEdit.withdrawProposal();
  await surface.proposalCwuEdit.submitProposal();

  await surface.proposalCwuEdit.open({ opportunityId, proposalId });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("submitted");
});
