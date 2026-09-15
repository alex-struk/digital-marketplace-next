// criterion: @R-7.9 v1
// provenance: blind, spec@08d8aac0ee7ec7fcee1a309ef183dcb17e38221b, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// The page removed is the seeded ordinary page, which the seed records as an
// administrator's page carrying three versions — the "several versions behind it" the
// given names. One more change is published before the removal, so that the test itself
// holds the wording of a version it replaced as well as the current one, and can look for
// both once the page is gone.
//
// Not asserted: "no version of its text survives anywhere in the service". No reading in
// the surface shows a removed page's text, and R-7.23 says nothing in the service shows an
// earlier version of a page, so no observation could tell a history that was erased from
// one that is merely never shown. The test goes only as far as the page's own address,
// which must not show either wording.
const ordinary = seed.content.ordinaryPage;
const replacement = "Wording published just before this page is removed.";

test("Removing an ordinary page removes it and every version of it permanently, and its address stops answering", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  // Given: the ordinary page is there, is not one the service needs, and has a past.
  await surface.contentEdit.open({ slug: ordinary.slug });
  await expect
    .poll(() => surface.contentEdit.pageAddress(), { message: "given: the seeded ordinary page exists" })
    .toContain(ordinary.slug);
  expect(await surface.contentEdit.fixedPageWarning(), "given: the page is an ordinary one").toBeFalsy();

  await surface.contentEdit.startEditing();
  const earlier = await surface.contentEdit.bodyBeingEdited();
  expect(earlier, "given: the wording about to be replaced can be read").toBeTruthy();
  await surface.contentEdit.editBody({ body: replacement });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();
  await expect.poll(() => surface.contentEdit.changesPublishedSuccess()).toBeTruthy();

  // When: an administrator confirms removing it.
  await surface.contentEdit.deletePage();
  await surface.contentEdit.confirmDeletePage();

  // Then: they are told it was removed, and are returned to the list, which no longer
  // carries its address.
  await expect.poll(() => surface.contentEdit.deletedSuccess()).toBeTruthy();
  await expect.poll(() => surface.contentList.pageTitle()).toBeTruthy();
  expect(await surface.contentList.pagePublicAddress()).not.toContain(ordinary.slug);

  // Its address is answered as not found, to anybody.
  await surface.signOut();
  await surface.contentView.open({ slug: ordinary.slug });
  await expect.poll(() => surface.contentView.notFoundForUnknownAddress()).toBeTruthy();
  expect(await surface.contentView.pageBody()).not.toContain(replacement);
  expect(await surface.contentView.pageBody()).not.toContain(earlier);
});
