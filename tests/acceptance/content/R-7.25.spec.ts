// criterion: @R-7.25 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-15
import { test, expect, persona } from "../../fixtures";

// The pages the service depends on carry no seed handle, so this one is named by the
// address the spec gives it. The harness puts the target back to its seed before each
// test, so the change of wording made here does not outlive the test.
//
// Removal and renaming are not taken on the screen's word alone. Each is attempted through
// the managing screen — an action on a control that is not offered fails, and one that is
// offered is carried through — and the page is then read where it stands.
//
// Not asserted: "a request to rename or remove it made another way is refused". The
// surface has no action that sends a request to the service other than through its
// screens, so the attempts through the screen are all a test can make.
const needed = "disclaimer";
const elsewhere = `derived-moved-disclaimer-${Date.now().toString(36)}`;
const title = "Disclaimer, as an administrator worded it";
const written = "Wording an administrator gave a page the service depends on.";

test("A page the service itself depends on may have its title and body changed but may not be renamed or removed, and its managing screen says so", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  // Given: the installation carries the page, and an administrator is on its managing screen.
  await surface.contentView.open({ slug: needed });
  await expect
    .poll(() => surface.contentView.pageTitle(), { message: `given: this installation carries "${needed}"` })
    .toBeTruthy();
  expect(await surface.contentView.notFoundForUnknownAddress(), `given: "${needed}" answers`).toBeFalsy();

  await surface.contentEdit.open({ slug: needed });
  await expect
    .poll(() => surface.contentEdit.pageAddress(), { message: `given: the managing screen of "${needed}" is open` })
    .toContain(needed);

  // Then: the screen says the service needs this page at this address, the address cannot
  // be typed over, and no removal is offered.
  await expect.poll(() => surface.contentEdit.fixedPageWarning(), { message: "the screen warns the page is needed" }).toBeTruthy();
  expect(await surface.contentEdit.slugLockedForFixedPage(), "the address is locked").toBeTruthy();
  expect(await surface.contentEdit.deleteWithheldForFixedPage(), "removal is withheld").toBeTruthy();

  // No removal is genuinely offered: attempting one through the screen goes nowhere.
  const removalOffered = await surface.contentEdit.deletePage().then(
    () => true,
    () => false,
  );
  if (removalOffered) await surface.contentEdit.confirmDeletePage().catch(() => undefined);
  expect.soft(removalOffered, "no removal is offered").toBe(false);

  await surface.signOut();
  await surface.contentView.open({ slug: needed });
  await expect.poll(() => surface.contentView.pageTitle(), { message: "the page was not removed" }).toBeTruthy();
  expect(await surface.contentView.notFoundForUnknownAddress(), "the page was not removed").toBeFalsy();

  // Its title and body may be changed.
  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: needed });
  await surface.contentEdit.startEditing();
  await surface.contentEdit.editTitle({ title });
  await surface.contentEdit.editBody({ body: written });
  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();
  await expect.poll(() => surface.contentEdit.changesPublishedSuccess()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: needed });
  await expect.poll(() => surface.contentView.pageTitle()).toBe(title);
  expect(await surface.contentView.pageBody()).toContain(written);

  // It may not be renamed: whether or not the screen lets the address be typed over, the
  // page is still at its address afterwards and nothing answers at the other.
  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug: needed });
  await surface.contentEdit.startEditing();
  const renameTyped = await surface.contentEdit.editSlug({ slug: elsewhere }).then(
    () => true,
    () => false,
  );
  if (renameTyped) {
    await surface.contentEdit.publishChanges().catch(() => undefined);
    await surface.contentEdit.confirmPublishChanges().catch(() => undefined);
  }
  expect.soft(renameTyped, "the address cannot be typed over").toBe(false);

  await surface.signOut();
  await surface.contentView.open({ slug: needed });
  await expect.poll(() => surface.contentView.pageTitle(), { message: "the page was not renamed" }).toBe(title);
  await surface.contentView.open({ slug: elsewhere });
  await expect.poll(() => surface.contentView.notFoundForUnknownAddress()).toBeTruthy();
});
