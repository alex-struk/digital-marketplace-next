// criterion: @R-1.21 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// The draft is complete but for its location, which is one of the fields the criterion's
// own note says is checked at this point, so the submission has exactly one reason to be
// refused. The second half — that the person is told the opportunity is incomplete rather
// than which field is missing — is read as the message asking for the opportunity to be
// completed while saying nothing of the field that was left out.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const allButLocation = {
  teaser: "A short summary of the work to be done.",
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

test("submitting a draft opportunity for review is refused unless the opportunity is complete", async ({
  surface,
}) => {
  const title = "R-1.21 incomplete draft submitted for review";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...allButLocation, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.submitForReview();

  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("draft");
});

test("the person is told the opportunity is incomplete rather than which field is missing", async ({
  surface,
}) => {
  const title = "R-1.21 incomplete draft whose refusal is read for what it names";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({ ...allButLocation, title });

  const refusal = (await surface.opportunityCwuCreate.fieldError()).toLowerCase();
  expect(refusal).toContain("complete");
  expect(refusal).not.toContain("location");
});
