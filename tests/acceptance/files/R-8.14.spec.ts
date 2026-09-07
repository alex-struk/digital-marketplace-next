// criterion: @R-8.14 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The criterion's own example: a file that is not an image but is named "portrait.png",
// chosen as a profile picture. What the surface can see of the outcome is that it is not
// refused and that it becomes the picture; that the stored bytes are unchanged is not
// observable, since no observation returns what was stored to compare it against what was
// sent.
//
// This is the behaviour R-8.21 replaces, so the two tests contradict each other on
// purpose: this one records what the service does today, R-8.21 what it should do.
test("a profile picture or logo that cannot be read as an image is stored as it was uploaded rather than refused", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);

  await surface.userProfile.open({ user: seed.users.fileUploader.id });
  const before = await surface.fileImagePicker.currentImage();

  await surface.userProfile.editProfile();
  await surface.fileImagePicker.chooseImage({ file: "portrait.png", content: "this is not an image at all" });

  expect(await surface.fileImagePicker.rejectedImageError()).toBeFalsy();
  expect(await surface.fileImagePicker.chosenImagePreview()).toBeTruthy();

  await surface.userProfile.saveChanges();

  expect(await surface.fileImagePicker.currentImage()).not.toBe(before);
});
