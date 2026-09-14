// criterion: @R-8.12 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// An identifier no stored file carries is taken from the seed rather than invented: the
// seeded published Code With Us opportunity's identifier is well-formed and is certainly not
// a file's.
//
// The criterion's claim is about the form the answer takes, so the non-administrator's answer
// for a missing file is read with the same observation as a refusal for lack of permission:
// the two must be indistinguishable to them. For the administrator the opposite is asserted.
const noSuchFile = seed.opportunities.publishedCodeWithUs.id;

test("a request for a file the requester may not read is answered as not authorized", async ({ surface }) => {
  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({
    name: "R-8.12 not shared.txt",
    content: `R-8.12 not shared ${Date.now()}`,
    readAccess: [],
  });
  const fileId = await surface.fileUpload.storedFileIdentifier();
  expect(fileId).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();

  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeTruthy();
});

test("a request for a file that does not exist is answered as not authorized", async ({ surface }) => {
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
  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeFalsy();
});
