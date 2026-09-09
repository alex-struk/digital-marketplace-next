// criterion: @R-2.23 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion's given is an opportunity whose deadline has passed, and the half of the
// claim that depends on it — that a withdrawn proposal cannot be put back in once the
// opportunity has stopped accepting proposals — is not asserted. A published opportunity
// cannot be given a deadline in the past, and no page, action or observation makes a
// deadline pass; the same reach is missing from R-1.1 and R-2.15.
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

async function publishOpportunity(surface: Surface, title: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...details, title });
  await surface.signOut();
}

async function submitProposal(surface: Surface, opportunity: string): Promise<void> {
  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal its author later takes back.",
  });
}

test("a vendor may withdraw a submitted proposal", async ({ surface }) => {
  const title = "R-2.23 opportunity whose proposal is withdrawn";
  await publishOpportunity(surface, title);
  await submitProposal(surface, title);

  await surface.proposalCwuEdit.open({ opportunity: title });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("submitted");

  await surface.proposalCwuEdit.withdrawProposal();

  await surface.proposalCwuEdit.open({ opportunity: title });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("withdrawn");
});

test("a vendor may put a withdrawn proposal back in while the opportunity is still accepting proposals", async ({
  surface,
}) => {
  const title = "R-2.23 opportunity whose withdrawn proposal is put back in";
  await publishOpportunity(surface, title);
  await submitProposal(surface, title);

  await surface.proposalCwuEdit.open({ opportunity: title });
  await surface.proposalCwuEdit.withdrawProposal();
  await surface.proposalCwuEdit.submitProposal();

  await surface.proposalCwuEdit.open({ opportunity: title });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("submitted");
});
