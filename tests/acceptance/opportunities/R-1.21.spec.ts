// criterion: @R-1.21 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// The given is a saved draft with a field still blank, and the when is its author submitting
// it for review. The draft is complete but for its location, one of the fields the criterion's
// own note says is checked at this point, so the submission has exactly one reason to be
// refused. The author is a member of staff whose own statement of permissions names no
// administrator rights, read before anything is created.
//
// A refusal is read as the draft still being a draft afterwards, whether the submission was
// turned away or could not be made at all.
//
// What the person is told is not asserted. The refusal happens on the screen for managing the
// saved draft, and that screen carries no observation of a message or refusal; the only
// field_error in the surface is on the create screen, which is reached by a draft that was
// never saved and so is not the given. A message saying the opportunity is incomplete, and
// naming no field, cannot be read where this criterion puts it.

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
  const title = "R-1.21 saved draft with no location submitted for review";

  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfile.open({ userId: seed.users.staffOne.id });
  const permissions = (await surface.userProfile.permissionsLabel()).toLowerCase();
  expect(permissions).toBeTruthy();
  expect(permissions).not.toContain("admin");

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...allButLocation, title });
  expect(await surface.opportunityCwuCreate.fieldError()).toBeFalsy();
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  expect(opportunityId).toBeTruthy();

  await surface.opportunityCwuView.open({ opportunityId });
  expect((await surface.opportunityCwuView.status()).toLowerCase()).toContain("draft");

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.submitForReview();

  await surface.opportunityCwuView.open({ opportunityId });
  const status = (await surface.opportunityCwuView.status()).toLowerCase();
  expect(status).toContain("draft");
  expect(status).not.toContain("review");
});
