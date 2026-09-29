// criterion: @R-8.12 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// An identifier no stored file carries is taken from the seed rather than invented: the
// seeded published Code With Us opportunity's identifier is well-formed and is certainly not
// a file's.
//
// The file the vendor may not read is stored by the file-uploader and marked readable by no
// one else. Both accounts are established as active first, so the upload can only turn on what
// it carries and the vendor's refusal can only be about read access; an upload that is not
// stored is reported by the refusal the service gave rather than read as an empty identifier.
const noSuchFile = seed.opportunities.publishedCodeWithUs.id;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

// The signed-in administrator is active by being signed in at all, so their own status badge
// is what "active" reads as.
async function establishActive(surface: Surface, ...userIds: string[]): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.userProfile.open({ userId: seed.users.administratorOne.id });
  const active = await surface.userProfile.statusBadge();
  for (const userId of userIds) {
    await surface.userProfile.open({ userId });
    if ((await surface.userProfile.statusBadge()) !== active) {
      await surface.userProfile.reactivateAccount();
      await surface.userProfile.confirmActivationChange();
      await surface.userProfile.open({ userId });
    }
    expect(await surface.userProfile.statusBadge()).toBe(active);
  }
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

test("a request for a file the requester may not read is answered as not authorized", async ({ surface }) => {
  const name = "not-shared.txt";
  await establishActive(surface, seed.users.fileUploader.id, seed.users.vendorOne.id);

  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({
    name,
    content: `R-8.12 not shared ${Date.now()}`,
    readAccess: [],
  });
  const fileId = await readOrEmpty(() => surface.fileUpload.storedFileIdentifier());
  if (!fileId) throw new Error(`the upload of "${name}" was not stored: ${await refusalOf(surface)}`);

  await surface.signIn(persona.vendor);
  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();

  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeTruthy();
});

test("a request for a file that does not exist is answered as not authorized", async ({ surface }) => {
  await establishActive(surface, seed.users.vendorOne.id);

  await surface.signIn(persona.vendor);
  await surface.fileDownload.open({ fileId: noSuchFile });
  await surface.fileDownload.downloadFile();

  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeTruthy();
});

test("a request for a file that does not exist is answered as not found when the requester is an administrator", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.fileDownload.open({ fileId: noSuchFile });
  await surface.fileDownload.downloadFile();

  expect(await surface.fileDownload.notFoundForAdministrator()).toBeTruthy();
  expect(await readOrEmpty(() => surface.fileDownload.refusedWhenNotPermitted())).toBeFalsy();
});
