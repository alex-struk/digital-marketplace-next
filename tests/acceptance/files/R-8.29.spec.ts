// criterion: @R-8.29 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// Three claims, one walk. That the reference put into the text is an internal marker and
// not a web address is asserted by what it lacks — no scheme separator anywhere in it —
// since no observation returns the stored text in any other form. That the marker becomes
// a download address only on display, and that the image is readable by anyone, are the
// same fact seen from the reader's side: somebody with no session at all opens the
// published page and the image is there.
test("an image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed", async ({
  surface,
}) => {
  const { slug } = seed.content.ordinaryPage;

  await surface.signIn(persona.administrator);
  await surface.contentEdit.open({ slug });
  await surface.contentEdit.startEditing();
  await surface.fileEmbeddedImage.uploadBodyImage({ file: "diagram.png" });

  const inserted = await surface.fileEmbeddedImage.imageInsertedIntoText();
  expect(inserted).toBeTruthy();
  expect(inserted.includes("://")).toBe(false);

  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();
  expect(await surface.contentEdit.changesPublishedSuccess()).toBeTruthy();
  await surface.signOut();

  await surface.contentView.open({ slug });
  expect(await surface.fileEmbeddedImage.imageRenderedInPublishedText()).toBeTruthy();
});
