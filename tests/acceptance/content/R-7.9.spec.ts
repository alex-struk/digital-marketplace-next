// criterion: @R-7.9 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The page removed here is built by the test rather than taken from the seed, so that the
// one seeded page other tests read by survives. It is given a second version before it is
// removed, so the removal is of a page with a history behind it as the criterion states.
//
// "No version of its text survives anywhere in the service" is not asserted: nothing in
// the surface shows a version of a page, present or past, so neither its survival nor its
// disappearance can be read.
const address = `derived-removed-${Date.now().toString(36)}`;

test("removing an ordinary page removes it, and its address stops answering", async ({ surface }) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A page about to be removed" });
  await surface.contentCreate.enterSlug({ slug: address });
  await surface.contentCreate.enterBody({ body: "The first wording of a page that will not last." });
  await surface.contentCreate.publishPage();
  await surface.contentCreate.confirmPublish();

  await surface.contentEdit.open({ slug: address });
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editBody({ body: "The second wording, so that a version stands behind the current one." });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();

  await surface.contentEdit.deletePage();
  await surface.contentEdit.confirmDeletePage();
  expect(await surface.contentEdit.deletedSuccess()).toBeTruthy();

  // Returned to the list, which still answers for an administrator.
  expect(await surface.contentList.pageTitle()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: address });
  expect(await surface.contentView.notFoundForUnknownAddress()).toBeTruthy();
});
