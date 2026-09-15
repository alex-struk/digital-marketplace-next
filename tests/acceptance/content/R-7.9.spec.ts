// criterion: @R-7.9 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona, seed } from "../../fixtures";

// The page removed is the seeded ordinary page, which the seed records as an
// administrator's page carrying three versions — the "several versions behind it" the
// given names. One more change is published before the removal, so that the test itself
// holds the wording of a version it replaced as well as the current one, and can look for
// both once the page is gone.
//
// "No version of its text survives anywhere in the service" is taken as far as the surface
// reaches: the page answers neither at its address nor by its identifier, and a new page
// published afterwards at the same address carries none of the removed page's wording —
// not in its body, and not in whatever its managing screen offers of a page's past. No
// observation reads the service's store directly, so a history kept but never shown
// anywhere cannot be told apart from one erased.
const ordinary = seed.content.ordinaryPage;
const replacement = "Wording published just before this page is removed.";
const successor = "Wording of a new page published at the address after the removal.";

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
  await expect
    .poll(() => surface.contentEdit.changesPublishedSuccess(), { message: "given: one more version is behind the page" })
    .toBeTruthy();

  // When: an administrator confirms removing it.
  await surface.contentEdit.deletePage();
  await surface.contentEdit.confirmDeletePage();

  // Then: they are told it was removed, and are returned to the list, which no longer
  // carries its address.
  await expect.poll(() => surface.contentEdit.deletedSuccess(), { message: "told the page was removed" }).toBeTruthy();
  await expect.poll(() => surface.contentList.pageTitle(), { message: "returned to the list of pages" }).toBeTruthy();
  expect(await surface.contentList.pagePublicAddress()).not.toContain(ordinary.slug);

  // Its address is answered as not found, to anybody, and so is its identifier.
  await surface.signOut();
  await surface.contentView.open({ slug: ordinary.slug });
  await expect.poll(() => surface.contentView.notFoundForUnknownAddress()).toBeTruthy();
  expect(await surface.contentView.pageBody()).not.toContain(replacement);
  expect(await surface.contentView.pageBody()).not.toContain(earlier);

  await surface.contentView.open({ slug: ordinary.id });
  await expect
    .poll(() => surface.contentView.notFoundForUnknownAddress(), { message: "the page is gone by its identifier too" })
    .toBeTruthy();

  // No version of its text survives: a page published at the same address afterwards starts
  // with no past, and none of the removed wording comes back with it.
  await surface.signIn(persona.administrator);
  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: ordinary.title });
  await surface.contentCreate.enterSlug({ slug: ordinary.slug });
  await surface.contentCreate.enterBody({ body: successor });
  await surface.contentCreate.publishPage();
  await surface.contentCreate.confirmPublish();

  await surface.contentEdit.open({ slug: ordinary.slug });
  await expect
    .poll(() => surface.contentEdit.pageAddress(), { message: "the address could be given to a new page" })
    .toContain(ordinary.slug);
  const past = await surface.contentEdit.versionHistory();
  expect(past).not.toContain(replacement);
  expect(past).not.toContain(earlier);

  await surface.signOut();
  await surface.contentView.open({ slug: ordinary.slug });
  await expect.poll(() => surface.contentView.pageBody()).toContain(successor);
  expect(await surface.contentView.pageBody()).not.toContain(replacement);
  expect(await surface.contentView.pageBody()).not.toContain(earlier);
});
