// criterion: @R-7.24 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The page is built by the test so that the seeded one keeps the address other tests read
// it by. Both addresses are opened as a visitor afterwards: the new one answers, the old
// one does not, and nothing offers to forward a reader from one to the other.
const stamp = Date.now().toString(36);
const oldAddress = `derived-before-move-${stamp}`;
const newAddress = `derived-after-move-${stamp}`;
const title = "A page that changes its address";

test("renaming a page moves it to its new address at once and leaves nothing at the old one", async ({ surface }) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title });
  await surface.contentCreate.enterSlug({ slug: oldAddress });
  await surface.contentCreate.enterBody({ body: "Wording that travels with the page when it moves." });
  await surface.contentCreate.publishPage();
  await surface.contentCreate.confirmPublish();

  await surface.contentEdit.open({ slug: oldAddress });
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editSlug({ slug: newAddress });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();
  expect(await surface.contentEdit.changesPublishedSuccess()).toBeTruthy();

  await surface.signOut();

  await surface.contentView.open({ slug: newAddress });
  expect(await surface.contentView.pageTitle()).toBe(title);
  expect(await surface.contentView.pageBody()).toContain("Wording that travels with the page when it moves.");

  await surface.contentView.open({ slug: oldAddress });
  expect(await surface.contentView.notFoundForUnknownAddress()).toBeTruthy();
});
