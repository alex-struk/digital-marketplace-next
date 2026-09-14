// criterion: @R-1.33 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// The note is read back off the opportunity's history, which is where the criterion says it
// appears and which R-1.30 has already established only the author and an administrator can
// see. "At any point in its life" is taken at the earliest point there is: each note below
// is attached to a draft.
//
// The attachments the criterion mentions are not asserted. No observation names what a note
// in the history carries, so a note with a file could not be told from a note without one.

test("an opportunity's author may attach a private note to a Code With Us opportunity's history", async ({
  surface,
}) => {
  const title = "R-1.33 Code With Us draft its author attached a note to";
  const note = "R-1.33 a private note the opportunity's own author wrote.";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.addNote({ text: note });

  await surface.opportunityCwuEdit.open({ opportunityId });
  expect(await surface.opportunityCwuEdit.historyTab()).toContain(note);
});

test("an administrator may attach a private note to a Sprint With Us opportunity's history", async ({
  surface,
}) => {
  const title = "R-1.33 Sprint With Us draft an administrator attached a note to";
  const note = "R-1.33 a private note an administrator wrote.";

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  await surface.opportunitySwuEdit.open({ opportunityId });
  await surface.opportunitySwuEdit.addNote({ text: note });

  await surface.opportunitySwuEdit.open({ opportunityId });
  expect(await surface.opportunitySwuEdit.historyTab()).toContain(note);
});
