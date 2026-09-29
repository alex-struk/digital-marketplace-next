// criterion: @R-8.2 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is a signed-in person able to upload. That the uploader's account is active is
// established before the upload rather than assumed, so the only thing the submission can turn
// on is what it carries. One submission carries all three parts — the bytes, the name and the
// read-access statement — and the record the criterion says comes back is read from the
// description of the stored file: its identifier, its name and the date it was stored.
//
// An upload that is not stored is reported by the refusal the service gave, so a failure names
// why the file was turned away rather than an empty identifier.

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

async function refusalOf(surface: Surface): Promise<string> {
  const refusals: [string, string][] = [
    ["refused as not signed in", await readOrEmpty(() => surface.fileUpload.refusedWhenSignedOut())],
    ["refused for its read-access statement", await readOrEmpty(() => surface.fileUpload.refusedForReadAccess())],
    ["refused for the length of its name", await readOrEmpty(() => surface.fileUpload.refusedForFileNameLength())],
    ["refused for its size", await readOrEmpty(() => surface.fileUpload.refusedForSize())],
    ["answered with a fault of the service", await readOrEmpty(() => surface.fileUpload.serviceFault())],
  ];
  const given = refusals.filter(([, said]) => said).map(([what, said]) => `${what}: ${said}`);
  return given.length ? given.join("; ") : "no refusal was reported";
}

test("an upload carries the file itself, a name to store it under, and a statement of who may read it, all in one submission", async ({
  surface,
}) => {
  const name = "terms-of-reference.pdf";

  await establishActive(surface, seed.users.fileUploader.id);
  await surface.signIn(persona.fileUploader);

  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({
    name,
    content: `R-8.2 one submission ${Date.now()}`,
    readAccess: [{ tag: "any" }],
  });

  const fileId = await readOrEmpty(() => surface.fileUpload.storedFileIdentifier());
  if (!fileId) throw new Error(`the upload of "${name}" was not stored: ${await refusalOf(surface)}`);

  await surface.fileDescription.open({ fileId });
  expect(await surface.fileDescription.fileIdentifier()).toBe(fileId);
  expect(await surface.fileDescription.fileName()).toBe(name);
  expect(await surface.fileDescription.storedDate()).toBeTruthy();
});
