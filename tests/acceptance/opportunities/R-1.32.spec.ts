// criterion: @R-1.32 v1
// provenance: blind, spec@897abf82ff1b013b15ba65777ea1336a8f5e50f6, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The seeded published opportunity was created by a member of public sector staff, so
// the first test's author is the staff member the criterion names rather than an
// administrator. Addenda accumulate on it, which is why every assertion is about the
// addendum this test wrote rather than about the whole list.
//
// That an addendum cannot be removed afterwards is not asserted: no action in the surface
// removes one, and the absence of an action is not something a test can read.

test("an addendum may be added to an opportunity that is no longer a draft by the staff member who created it, and is recorded in its history", async ({
  surface,
}) => {
  const addendum = "R-1.32 addendum added by the staff member who created the opportunity.";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  const historyBefore = await surface.opportunityCwuEdit.historyTab();

  await surface.opportunityCwuEdit.addAddendum({ text: addendum });

  expect(await surface.opportunityCwuEdit.addendaTab()).toContain(addendum);
  expect(await surface.opportunityCwuEdit.historyTab()).not.toBe(historyBefore);

  await surface.opportunityCwuView.open({ id: seed.opportunities.publishedCodeWithUs.id });
  expect(await surface.opportunityCwuView.addenda()).toContain(addendum);
});

test("an addendum may be added to an opportunity that is no longer a draft by an administrator", async ({
  surface,
}) => {
  const addendum = "R-1.32 addendum added by an administrator.";

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  await surface.opportunityCwuEdit.addAddendum({ text: addendum });

  expect(await surface.opportunityCwuEdit.addendaTab()).toContain(addendum);
});

test("an addendum may not be added to an opportunity that is still a draft, and may not be longer than 5,000 characters", async ({
  surface,
}) => {
  const draftTitle = "R-1.32 draft offered an addendum";
  const onDraft = "R-1.32 addendum offered to a draft.";
  const tooLong = "x".repeat(5001);

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: draftTitle });

  await surface.opportunityCwuEdit.open({ title: draftTitle });
  await surface.opportunityCwuEdit.addAddendum({ text: onDraft });
  expect(await surface.opportunityCwuEdit.addendaTab()).not.toContain(onDraft);

  await surface.opportunityCwuEdit.open({ id: seed.opportunities.publishedCodeWithUs.id });
  await surface.opportunityCwuEdit.addAddendum({ text: tooLong });
  expect(await surface.opportunityCwuEdit.addendaTab()).not.toContain(tooLong);
});
