// criterion: @R-7.22 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// The criterion's example address is "about". The address taken here is the seeded
// ordinary page's instead: the rule is the same for any address, and the seeded page is a
// record the test can establish is there, where a page the installation is meant to carry
// may not be. Both halves complete the publication they start, as an administrator would,
// so that the clashing submission is actually sent before its refusal is read.
const taken = seed.content.ordinaryPage;
const intruding = "Wording that should never reach a reader.";

test("No two pages may share an address, whether the clash arises on creating a page or on renaming one — on creating a page", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentView.open({ slug: taken.slug });
  await expect
    .poll(() => surface.contentView.pageTitle(), { message: "given: a page is already published at the address" })
    .toBe(taken.title);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A second page claiming a taken address" });
  await surface.contentCreate.enterSlug({ slug: taken.slug });
  await surface.contentCreate.enterBody({ body: intruding });
  await surface.contentCreate.publishPage();
  await surface.contentCreate.confirmPublish();

  await expect.poll(() => surface.contentCreate.duplicateSlugError()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: taken.slug });
  await expect.poll(() => surface.contentView.pageTitle()).toBe(taken.title);
  expect(await surface.contentView.pageBody()).not.toContain(intruding);
});

test("No two pages may share an address, whether the clash arises on creating a page or on renaming one — on renaming one", async ({
  surface,
}) => {
  const other = `derived-rename-clash-${Date.now().toString(36)}`;
  const otherTitle = "A page that will try to take a taken address";

  await surface.signIn(persona.administrator);

  await surface.contentView.open({ slug: taken.slug });
  await expect
    .poll(() => surface.contentView.pageTitle(), { message: "given: a page is already published at the address" })
    .toBe(taken.title);

  // A different page, published at an address of its own.
  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: otherTitle });
  await surface.contentCreate.enterSlug({ slug: other });
  await surface.contentCreate.enterBody({ body: "Wording belonging to the page doing the renaming." });
  await surface.contentCreate.publishPage();
  await surface.contentCreate.confirmPublish();

  await surface.contentEdit.open({ slug: other });
  await expect
    .poll(() => surface.contentEdit.pageAddress(), { message: "given: a different page exists to be renamed" })
    .toContain(other);

  await surface.contentEdit.startEditing();
  await surface.contentEdit.editSlug({ slug: taken.slug });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();

  await expect.poll(() => surface.contentEdit.duplicateSlugError()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: taken.slug });
  await expect.poll(() => surface.contentView.pageTitle()).toBe(taken.title);

  // The page that tried to move is still where it was.
  await surface.contentView.open({ slug: other });
  await expect.poll(() => surface.contentView.pageTitle()).toBe(otherTitle);
});
