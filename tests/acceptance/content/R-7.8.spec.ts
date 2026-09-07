// criterion: @R-7.8 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The seeded page is the one with a history behind it and an updated date months in the
// past, so a change made now is visible as a change of that date. Only its body is
// touched, leaving the title other tests read by.
//
// The third part of the criterion's outcome — that the replaced wording is kept as an
// earlier version — is not asserted, because R-7.23 records that nothing in the service
// shows an earlier version and the content-edit surface names no observation of one.
const replacement = "The wording this page carries after the change was published.";

test("publishing a change to a page shows the new text to every reader from that moment, and the page's updated date becomes the moment of the change", async ({
  surface,
}) => {
  await surface.contentView.open({ slug: seed.content.ordinaryPage.slug });
  const readerSawBefore = await surface.contentView.pageBody();
  const readerUpdatedBefore = await surface.contentView.updatedDate();

  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: seed.content.ordinaryPage.slug });
  const managedUpdatedBefore = await surface.contentEdit.updatedDate();

  await surface.contentEdit.startEditing();
  await surface.contentEdit.editBody({ body: replacement });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();

  expect(await surface.contentEdit.changesPublishedSuccess()).toBeTruthy();
  expect(await surface.contentEdit.updatedDate()).not.toBe(managedUpdatedBefore);

  await surface.signOut();
  await surface.contentView.open({ slug: seed.content.ordinaryPage.slug });
  const readerSeesNow = await surface.contentView.pageBody();
  expect(readerSeesNow).toContain(replacement);
  expect(readerSeesNow).not.toBe(readerSawBefore);
  expect(await surface.contentView.updatedDate()).not.toBe(readerUpdatedBefore);
});
