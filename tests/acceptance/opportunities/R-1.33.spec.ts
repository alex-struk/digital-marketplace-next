// criterion: @R-1.33 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The note is added to a draft, which is the earliest point in an opportunity's life, so
// "at any point" is exercised at the end of it that is easiest to be sure of. That only
// the author and administrators can see the history the note lands in is R-1.30's claim,
// asserted there.
//
// Team With Us is not exercised: the surface offers add_note on the Code With Us and
// Sprint With Us management surfaces only, which is the difference the criterion itself
// draws.

test("an opportunity's author may attach a private note, with files, to a Code With Us opportunity's history", async ({
  surface,
}) => {
  const title = "R-1.33 Code With Us draft given a private note";
  const note = "R-1.33 a private note about the Code With Us opportunity.";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });

  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.addNote({ note, attachments: ["briefing.pdf"] });

  const history = await surface.opportunityCwuEdit.historyTab();
  expect(history).toContain(note);
  expect(history).toContain("briefing.pdf");
});

test("an administrator may attach a private note, with files, to a Sprint With Us opportunity's history", async ({
  surface,
}) => {
  const title = "R-1.33 Sprint With Us draft given a private note";
  const note = "R-1.33 a private note about the Sprint With Us opportunity.";

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });

  await surface.opportunitySwuEdit.open({ title });
  await surface.opportunitySwuEdit.addNote({ note, attachments: ["briefing.pdf"] });

  const history = await surface.opportunitySwuEdit.historyTab();
  expect(history).toContain(note);
  expect(history).toContain("briefing.pdf");
});
