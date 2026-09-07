// criterion: @R-7.25 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The pages the service depends on have no seed handle, so this one is written out by the
// address the criteria give it. "disclaimer" is chosen because no other test in this
// domain reads its wording, and this test changes that wording.
const needed = "disclaimer";

test("the managing screen of a page the service depends on says the service needs it here: its address cannot be typed over and no removal is offered", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentEdit.open({ slug: needed });

  expect(await surface.contentEdit.fixedPageWarning()).toBeTruthy();
  expect(await surface.contentEdit.slugLockedForFixedPage()).toBeTruthy();
  expect(await surface.contentEdit.deleteWithheldForFixedPage()).toBeTruthy();
});

test("a page the service depends on may have its title and body changed", async ({ surface }) => {
  const written = "Wording an administrator gave a page the service depends on.";

  await surface.signIn(persona.administrator);

  await surface.contentEdit.open({ slug: needed });
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editTitle({ title: "Disclaimer" });
  await surface.contentEdit.editBody({ body: written });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();

  expect(await surface.contentEdit.changesPublishedSuccess()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: needed });
  expect(await surface.contentView.pageTitle()).toBe("Disclaimer");
  expect(await surface.contentView.pageBody()).toContain(written);
});
