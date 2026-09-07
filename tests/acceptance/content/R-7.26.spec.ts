// criterion: @R-7.26 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The image control is the criterion's own given and when, and it is the part of the
// editor the surface reaches: the formatting shortcuts and the link to the guidance page
// are named by no action and no observation, so neither is asserted here.
//
// No file is named to the upload: nothing in the seed holds one — the manifest records
// that a file is bytes on the service's own disk and that tests upload what they need —
// so the choosing of the file is left to the surface.
const address = `derived-with-image-${Date.now().toString(36)}`;

test("the editor's image control stores the image, places a reference to it in the body, and the published page shows it", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A page with an image in its body" });
  await surface.contentCreate.enterSlug({ slug: address });
  await surface.contentCreate.enterBody({ body: "Wording with room for an image after it." });
  await surface.contentCreate.publishPage();
  await surface.contentCreate.confirmPublish();

  await surface.contentEdit.open({ slug: address });
  await surface.contentEdit.startEditing();

  await surface.fileEmbeddedImage.uploadBodyImage();
  expect(await surface.fileEmbeddedImage.imageInsertedIntoText()).toBeTruthy();

  await surface.contentEdit.publishChanges();
  await surface.contentEdit.confirmPublishChanges();
  expect(await surface.contentEdit.changesPublishedSuccess()).toBeTruthy();

  expect(await surface.fileEmbeddedImage.imageRenderedInPublishedText()).toBeTruthy();
});
