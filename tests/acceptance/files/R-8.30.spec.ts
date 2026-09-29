// criterion: @R-8.30 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion's own example: a signed-in person choosing a file named "portrait.gif" as a new
// profile picture. Its content is a real PNG, so the name is the only thing wrong with it and a
// refusal can only have come from the ending.
//
// The upload the criterion is about happens when the changed profile is saved, so the change
// is saved before anything is read. A screen that will not let the save go through has refused
// it as surely as a service that turns it down, so a save the screen declines is not treated as
// a failure of the test. The refusal is then read, and "no file is stored" is read as the
// profile picture, opened afresh, being the one it was before.
//
// The person's account is established as active first, so the refusal can only be about the
// file.

// A 1x1 PNG.
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c636000000002000148afa4710000000049454e44ae426082",
  "hex",
);

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

// The signed-in administrator is active by being signed in at all, so their own status badge
// is what "active" reads as.
async function establishActive(surface: Surface, userId: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  const active = await surface.userProfile.statusBadge();
  await surface.userProfile.open({ userId });
  if ((await surface.userProfile.statusBadge()) !== active) {
    await surface.userProfile.reactivateAccount();
    await surface.userProfile.confirmActivationChange();
    await surface.userProfile.open({ userId });
  }
  expect(await surface.userProfile.statusBadge()).toBe(active);
}

test("a profile picture or an organization logo whose name does not end in .jpg, .jpeg or .png is refused", async ({
  surface,
}) => {
  await establishActive(surface, seed.users.fileUploader.id);
  await surface.signIn(persona.fileUploader);

  await surface.userProfileSelf.open();
  const before = await readOrEmpty(() => surface.fileImagePicker.currentImage());

  await surface.userProfileSelf.editProfile();
  await surface.fileImagePicker.chooseImage({ file: "portrait.gif", content: PNG });
  try {
    await surface.userProfileSelf.saveChanges();
  } catch {
    // A save the screen will not make is refused; the refusal and the picture are read below.
  }

  await expect.poll(() => readOrEmpty(() => surface.fileImagePicker.rejectedImageError())).toBeTruthy();

  await surface.userProfileSelf.open();
  expect(await readOrEmpty(() => surface.fileImagePicker.currentImage())).toBe(before);
});
