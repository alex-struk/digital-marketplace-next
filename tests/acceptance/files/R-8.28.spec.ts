// criterion: @R-8.28 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// Being marked readable by anyone is not itself observable — no observation returns what
// was recorded against a file — so both tests read it the way a person would: the image
// is still there for somebody with no session at all. The logo test is the criterion's
// own example, walked as far as the public list of organizations.
test("profile pictures are marked readable by anyone", async ({ surface }) => {
  await surface.signIn(persona.fileUploader);
  await surface.userProfile.open({ user: seed.users.fileUploader.id });
  await surface.userProfile.editProfile();
  await surface.fileImagePicker.chooseImage({ file: "portrait.png" });
  await surface.userProfile.saveChanges();
  expect(await surface.fileImagePicker.currentImage()).toBeTruthy();
  await surface.signOut();

  await surface.fileImagePicker.open({ user: seed.users.fileUploader.id });
  expect(await surface.fileImagePicker.imageReadableWhenSignedOut()).toBeTruthy();
});

test("organization logos are marked readable by anyone", async ({ surface }) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ organization: seed.organizations.qualified.id });
  await surface.organizationEdit.editOrganization();
  await surface.fileImagePicker.chooseImage({ file: "logo.png" });
  await surface.organizationEdit.saveChanges();
  expect(await surface.fileImagePicker.currentImage()).toBeTruthy();
  await surface.signOut();

  await surface.organizationList.open();
  expect(await surface.organizationList.organizationName()).toContain(seed.organizations.qualified.legal_name);
  expect(await surface.fileImagePicker.imageReadableWhenSignedOut()).toBeTruthy();
});
