// criterion: @R-8.30 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The criterion's own example: a file named "portrait.gif" chosen as a profile picture.
// The chooser offering only the three endings is asserted alongside the refusal, because
// the two together are what the criterion claims — the offer narrows what a person can
// pick, and the refusal is what actually holds when something else arrives.
test("a profile picture or an organization logo whose name does not end in .jpg, .jpeg or .png is refused", async ({
  surface,
}) => {
  await surface.signIn(persona.fileUploader);

  await surface.userProfile.open({ user: seed.users.fileUploader.id });
  const before = await surface.fileImagePicker.currentImage();

  await surface.userProfile.editProfile();
  expect(await surface.fileImagePicker.onlyJpegAndPngOffered()).toBeTruthy();

  await surface.fileImagePicker.chooseImage({ file: "portrait.gif" });

  expect(await surface.fileImagePicker.rejectedImageError()).toBeTruthy();

  await surface.userProfile.cancelEditing();

  expect(await surface.fileImagePicker.currentImage()).toBe(before);
});
