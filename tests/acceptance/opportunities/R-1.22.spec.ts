// criterion: @R-1.22 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// The opportunity is complete, so nothing but the requester's standing is left to refuse
// the publication. It is asked for twice: once by the member of staff who created it, whose
// request must leave it where it was, and once by an administrator, so that the refusal can
// be told from an opportunity that simply cannot be published.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const complete = {
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
  completionDate: inDays(90),
};

test("only an administrator may publish an opportunity", async ({ surface }) => {
  const title = "R-1.22 opportunity its author asked to publish";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.publish();

  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).not.toContain("published");
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.publish();

  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("published");
});
