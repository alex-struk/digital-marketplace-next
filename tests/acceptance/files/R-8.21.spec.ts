// criterion: @R-8.21 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// "Whatever its name says" is the whole point, so the file offered here carries an ending
// the picker accepts and content that is not an image. A refusal here can only have come
// from reading the content, since the name alone would have passed.
//
// The second half — an image that reads successfully but cannot be resized is stored at
// its original size rather than refused — is not asserted. Nothing in the surface can
// produce an image the resizer chokes on rather than one it reads, and no observation
// reports the size an image was stored at, so neither the condition nor the outcome is
// reachable.
test("a profile picture or organization logo is accepted only if its content can be read as a JPEG or a PNG, and a file whose content is neither is refused whatever its name says", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);

  await surface.userProfile.open({ user: seed.users.fileUploader.id });
  const before = await surface.fileImagePicker.currentImage();

  await surface.userProfile.editProfile();
  await surface.fileImagePicker.chooseImage({ file: "portrait.png", content: "this is not an image at all" });

  expect(await surface.fileImagePicker.rejectedImageError()).toBeTruthy();

  await surface.userProfile.cancelEditing();

  expect(await surface.fileImagePicker.currentImage()).toBe(before);
});
