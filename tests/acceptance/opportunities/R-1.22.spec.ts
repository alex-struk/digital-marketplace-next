// criterion: @R-1.22 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The draft is complete, so nothing but the requester's standing is left to refuse it.
// The second test is the other side of the same rule: the same opportunity published by
// an administrator, which is what makes the first test's refusal a rule about who is
// asking rather than about the opportunity.

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

test("a member of public sector staff who is not an administrator asking to publish an opportunity is refused and the opportunity stays unpublished", async ({
  surface,
}) => {
  const title = "R-1.22 draft an ordinary member of staff asked to publish";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.publish();

  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).not.toContain("published");
});

test("only an administrator may publish an opportunity", async ({ surface }) => {
  const title = "R-1.22 draft an administrator published";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.publish();

  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("published");
});
