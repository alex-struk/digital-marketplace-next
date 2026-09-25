// criterion: @R-1.21 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona } from "../../fixtures";

// The given is a saved draft with a field still blank, and the when is its author submitting
// it for review. The field left blank is the location, one of the fields the criterion's own
// note says is checked at this point, and everything else is complete, so the submission has
// exactly one reason to be refused.
//
// A new opportunity's location starts filled in, so leaving it out of the form leaves a
// location in place. It is therefore emptied explicitly: the draft is first saved with a
// location of its own and shown to carry it, then changed to an empty location, and the saved
// draft is shown no longer to carry it before it is submitted.
//
// The refusal is read as the draft still being a draft afterwards; a submission the screen
// will not offer at all also leaves it a draft, since the action fails rather than waits. What
// the author is told is read on the screen where the submission is made, and waited for. Only
// its saying the opportunity is incomplete is asserted: that it does not name the missing
// field cannot be told apart on that screen, which carries the form's own field labels,
// location among them.

const statement =
  "Submitting a draft opportunity for review is refused unless the opportunity is complete, and the person is told the opportunity is incomplete rather than which field is missing.";

const settle = { timeout: 15000 };
const quietPeriod = 5000;

function pacificDay(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
}

const placedLocation = "R-1.21 Placeholder Harbour";

const complete = {
  teaser: "A short summary of the work to be done.",
  location: placedLocation,
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
  const title = "R-1.21 saved draft with its location emptied, submitted for review";

  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...complete, title });
  await expect.poll(() => surface.opportunityCwuEdit.opportunityIdentifier(), settle).toBeTruthy();
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await expect.poll(() => surface.opportunityCwuEdit.opportunityTab(), settle).toContain(placedLocation);

  await surface.opportunityCwuEdit.editDetails({ location: "" });
  await expect
    .poll(async () => {
      await surface.opportunityCwuEdit.open({ opportunityId });
      return surface.opportunityCwuEdit.opportunityTab();
    }, settle)
    .not.toContain(placedLocation);

  await surface.opportunityCwuView.open({ opportunityId });
  await expect.poll(async () => (await surface.opportunityCwuView.status()).toLowerCase(), settle).toContain("draft");

  await surface.opportunityCwuEdit.open({ opportunityId });
  try {
    await surface.opportunityCwuEdit.submitForReview();
  } catch {
    // A submission that is not offered is refused; the draft's state is checked below.
  }
  await expect.poll(() => surface.opportunityCwuEdit.opportunityTab(), settle).toMatch(/incomplete/i);

  await new Promise((resolve) => setTimeout(resolve, quietPeriod));
  await surface.opportunityCwuView.open({ opportunityId });
  const status = (await surface.opportunityCwuView.status()).toLowerCase();
  expect(status).toContain("draft");
  expect(status).not.toContain("review");
});
