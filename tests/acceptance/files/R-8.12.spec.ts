// criterion: @R-8.12 v1
// provenance: blind, spec@258c8b6542d73fd923b7fbc7b8c8d9d82627255b, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";

// The file the vendor may not read is the seeded one only its uploader may read, so no upload
// and no preliminary step stands between the test and the request the criterion is about.
//
// An identifier no stored file carries is taken from the seed rather than invented: the seeded
// published Code With Us opportunity's identifier is well-formed and is certainly not a file's.
const notReadableByVendor = seed.stored_files.privateOfFileUploader;
const noSuchFile = seed.opportunities.publishedCodeWithUs.id;

test("a request for a file the requester may not read is answered as not authorized", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.fileDownload.open({ fileId: notReadableByVendor.id });
  await surface.fileDownload.downloadFile();

  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeTruthy();
});

test("a request for a file that does not exist is answered as not authorized", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.fileDownload.open({ fileId: noSuchFile });
  await surface.fileDownload.downloadFile();

  expect(await surface.fileDownload.refusedForUnknownFile()).toBeTruthy();
});

test("a request for a file that does not exist is answered as not found when the requester is an administrator", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.fileDownload.open({ fileId: noSuchFile });
  await surface.fileDownload.downloadFile();

  expect(await surface.fileDownload.notFoundForAdministrator()).toBeTruthy();
});
