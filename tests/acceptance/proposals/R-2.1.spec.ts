// criterion: @R-2.1 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each test publishes an opportunity of its own rather than bidding on the seeded one, so
// that the proposal one persona is allowed to start and the three refusals are measured
// against a record no other test has bid on. A vendor may hold only one proposal per
// opportunity (R-2.2), so a shared opportunity would make the order tests run in matter.
//
// A refusal is read as the create screen having nothing on it. The proposal surfaces carry
// no observation of a permission refusal, so what somebody who may not start a proposal
// sees is the absence of the opportunity summary the screen otherwise leads with.
//
// The clause about a vendor who has never accepted the service's terms is not asserted.
// Every account the contract can sign in as has accepted them at some point, including
// vendor-with-terms-reset, whose acceptance was reset after the fact, so an account that
// never accepted them cannot be reached.

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

test("a signed-in vendor who has accepted the service's terms may start a proposal", async ({
  surface,
}) => {
  const title = "R-2.1 opportunity a vendor may start a proposal against";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open({ title });
  await surface.opportunityCwuView.startProposal();

  expect(await surface.proposalCwuCreate.opportunitySummary()).toBeTruthy();
});

test("a request to start a proposal from public sector staff, an administrator or an anonymous visitor is refused", async ({
  surface,
}) => {
  const title = "R-2.1 opportunity nobody but a vendor may start a proposal against";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.publicSectorStaff);
  await surface.proposalCwuCreate.open({ opportunity: title });
  expect(await surface.proposalCwuCreate.opportunitySummary()).toBeFalsy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.proposalCwuCreate.open({ opportunity: title });
  expect(await surface.proposalCwuCreate.opportunitySummary()).toBeFalsy();
  await surface.signOut();

  await surface.proposalCwuCreate.open({ opportunity: title });
  expect(await surface.proposalCwuCreate.opportunitySummary()).toBeFalsy();
});
