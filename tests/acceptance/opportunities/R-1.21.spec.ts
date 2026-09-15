// criterion: @R-1.21 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona } from "../../fixtures";

// The given is a saved draft with a field still blank, and the when is its author submitting
// it for review. The draft is complete but for its location, one of the fields the criterion's
// own note says is checked at this point, so the submission has exactly one reason to be
// refused. The author is a member of staff; that they hold no administrator rights is read
// from the kind of account their own profile shows, which every account carries.
//
// The refusal is read as the draft still being a draft afterwards. A submission the screen
// will not offer at all also leaves it a draft, since the action fails rather than waits.
//
// What the author is told is read from the opportunity tab of the screen for managing the
// draft, which is where the submission is made, and waited for. Only its saying the
// opportunity is incomplete is asserted. That it does not name the missing field cannot be
// told apart on that tab, which carries the form's own field labels, location among them.

const statement =
  "Submitting a draft opportunity for review is refused unless the opportunity is complete, and the person is told the opportunity is incomplete rather than which field is missing.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;

function pacificDay(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
}

const allButLocation = {
  teaser: "A short summary of the work to be done.",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: pacificDay(14),
  assignmentDate: pacificDay(21),
  startDate: pacificDay(28),
  completionDate: pacificDay(90),
};

test(statement, async ({ surface }) => {
  const title = "R-1.21 saved draft with no location submitted for review";

  await surface.signIn(persona.publicSectorStaff);
  await surface.userProfileSelf.open();
  const kind = await surface.userProfileSelf.accountType();
  expect(kind).toBeTruthy();
  expect(kind.toLowerCase()).not.toContain("admin");

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...allButLocation, title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  expect(opportunityId).toBeTruthy();

  await surface.opportunityCwuView.open({ opportunityId });
  await expect.poll(async () => (await surface.opportunityCwuView.status()).toLowerCase(), settle).toContain("draft");

  await surface.opportunityCwuEdit.open({ opportunityId });
  try {
    await surface.opportunityCwuEdit.submitForReview();
  } catch {
    // A submission that is not offered is refused; the draft's status is checked below.
  }
  await expect.poll(() => surface.opportunityCwuEdit.opportunityTab(), settle).toMatch(/incomplete/i);

  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  await surface.opportunityCwuView.open({ opportunityId });
  const status = (await surface.opportunityCwuView.status()).toLowerCase();
  expect(status).toContain("draft");
  expect(status).not.toContain("review");
});
