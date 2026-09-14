// criterion: @R-8.1 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";

// Both halves send the same submission to the address that stores a file, so the only thing
// that differs between them is whether anybody is signed in. persona.fileUploader is a vendor
// holding no role, no organization membership and no administrator right, so an upload that
// succeeds for them turned on nothing but being signed in.
function submission() {
  return {
    name: "R-8.1 upload.pdf",
    content: `R-8.1 upload ${Date.now()}`,
    readAccess: [{ tag: "user", value: seed.users.fileUploader.id }],
  };
}

test("any person who is signed in may upload a file", async ({ surface }) => {
  await surface.signIn(persona.fileUploader);

  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess(submission());

  expect(await surface.fileUpload.refusedWhenSignedOut()).toBeFalsy();
  expect(await surface.fileUpload.storedFileIdentifier()).toBeTruthy();
});

test("a visitor who is not signed in cannot upload a file, and no file is stored", async ({ surface }) => {
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess(submission());

  expect(await surface.fileUpload.refusedWhenSignedOut()).toBeTruthy();
  expect(await surface.fileUpload.storedFileIdentifier()).toBeFalsy();
});
