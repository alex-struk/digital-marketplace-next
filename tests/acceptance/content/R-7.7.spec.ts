// criterion: @R-7.7 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// A page that does not exist yet has no seed handle, so the address and wording are chosen
// here. The address is made unique per run so that a second run against the same target is
// not refused for clashing with what the first one left behind.
const address = `derived-created-${Date.now().toString(36)}`;
const title = "A page an administrator made";
const body = "The wording an administrator gave this page when they created it.";

test("an administrator can create a page by giving it a title, an address and a body, and once published it is readable by anyone at that address", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title });
  await surface.contentCreate.enterSlug({ slug: address });
  await surface.contentCreate.enterBody({ body });

  expect(await surface.contentCreate.resultingPublicAddress()).toContain(address);

  await surface.contentCreate.publishPage();
  expect(await surface.contentCreate.publishConfirmation()).toBeTruthy();
  await surface.contentCreate.confirmPublish();
  expect(await surface.contentCreate.publishedSuccess()).toBeTruthy();

  // Taken to its managing screen, which is where the dates and authorship of the new page
  // are recorded.
  await surface.contentEdit.open({ slug: address });
  expect(await surface.contentEdit.publishedDate()).toBeTruthy();

  // And readable by anyone: the session is dropped before the address is opened again.
  await surface.signOut();
  await surface.contentView.open({ slug: address });
  expect(await surface.contentView.pageTitle()).toBe(title);
  expect(await surface.contentView.pageBody()).toContain(body);
});
