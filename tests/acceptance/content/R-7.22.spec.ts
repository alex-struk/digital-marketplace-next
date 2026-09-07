// criterion: @R-7.22 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The address already taken is the seeded page's own, so the clash is with a record rather
// than with something this test put there a moment earlier.
const rename = `derived-rename-clash-${Date.now().toString(36)}`;

test("a page cannot be created at an address another page already holds, and the existing page is untouched", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A second page claiming a taken address" });
  await surface.contentCreate.enterSlug({ slug: seed.content.ordinaryPage.slug });
  await surface.contentCreate.enterBody({ body: "Wording that should never reach a reader." });
  await surface.contentCreate.publishPage();

  expect(await surface.contentCreate.duplicateSlugError()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: seed.content.ordinaryPage.slug });
  expect(await surface.contentView.pageTitle()).toBe(seed.content.ordinaryPage.title);
  expect(await surface.contentView.pageBody()).not.toContain("Wording that should never reach a reader.");
});

test("a page cannot be renamed to an address another page already holds, and the existing page is untouched", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A page that will try to take a taken address" });
  await surface.contentCreate.enterSlug({ slug: rename });
  await surface.contentCreate.enterBody({ body: "Wording belonging to the page doing the renaming." });
  await surface.contentCreate.publishPage();
  await surface.contentCreate.confirmPublish();

  await surface.contentEdit.open({ slug: rename });
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editSlug({ slug: seed.content.ordinaryPage.slug });
  await surface.contentEdit.publishChanges();

  expect(await surface.contentEdit.duplicateSlugError()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: seed.content.ordinaryPage.slug });
  expect(await surface.contentView.pageTitle()).toBe(seed.content.ordinaryPage.title);

  // And the page that tried to move is still where it was.
  await surface.contentView.open({ slug: rename });
  expect(await surface.contentView.pageTitle()).toBe("A page that will try to take a taken address");
});
