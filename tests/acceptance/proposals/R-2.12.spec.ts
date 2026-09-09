// criterion: @R-2.12 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The draft is saved with nothing filled in at all — no proponent, no proposal text — which
// is as incomplete as the create screen allows, and the assertion is that the screen raises
// no error and the proposal exists afterwards as a draft.
//
// The second half of the criterion, that attachments are checked even in draft, is not
// asserted. Its given is a draft carrying an attachment that does not exist, and no action
// in the surface names a file that is already stored: add_attachment offers a file from the
// machine the test runs on, which by construction exists. The same reach is missing from
// R-8.15 and R-8.22.

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

test("a proposal saved as a draft is accepted however incomplete it is", async ({ surface }) => {
  const title = "R-2.12 opportunity carrying an empty draft proposal";
  await publishOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.saveDraft();

  expect(await surface.proposalCwuCreate.fieldError()).toBeFalsy();

  await surface.proposalCwuEdit.open({ opportunity: title });
  expect((await surface.proposalCwuEdit.status()).toLowerCase()).toContain("draft");
});
