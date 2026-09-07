// criterion: @R-1.20 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The change the criterion names first — from draft straight to an evaluation stage —
// has no action behind it in the surface, so it cannot be requested and cannot be
// refused. The one it names second, a change out of a final state, does: an opportunity
// is cancelled and then asked to publish again.
//
// The state is read back from the opportunity rather than from a refusal message; the
// opportunity's management surface names no error observation at all.

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

test("a request to change an opportunity to a state that is not reachable from its own is refused and its state is unchanged", async ({
  surface,
}) => {
  const title = "R-1.20 cancelled opportunity asked to publish again";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...complete, title });

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.cancelOpportunity({ note: "Withdrawn by the ministry." });
  await surface.opportunityCwuEdit.publish();

  await surface.opportunityCwuView.open({ title });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("cancel");
});
