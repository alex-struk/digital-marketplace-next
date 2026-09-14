// criterion: @R-8.7 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion's own example comes first: a file one vendor stored and marked readable by no
// one else, refused to a second vendor and received by an administrator. Each of the other
// ways of being allowed that the criterion names is then walked on its own, with somebody the
// statement does not reach refused beside somebody it does, so that each grant is seen to be
// the reason and not a wider default.
//
// A named person and a named account type are taken from the seed: the vendor persona's own
// account, and the account type the seeded public sector staff member holds.
async function store(surface: Surface, name: string, content: string, readAccess: unknown[]): Promise<string> {
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({ name, content, readAccess });
  const fileId = await surface.fileUpload.storedFileIdentifier();
  expect(fileId).toBeTruthy();
  return fileId;
}

async function reads(surface: Surface, fileId: string, content: string): Promise<void> {
  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeFalsy();
  expect(await surface.fileDownload.fileContents()).toContain(content);
}

async function isRefused(surface: Surface, fileId: string): Promise<void> {
  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeTruthy();
}

test("a file marked readable by no one else is readable by whoever uploaded it and by any administrator, and refused to another vendor", async ({
  surface,
}) => {
  const content = `R-8.7 private ${Date.now()}`;

  await surface.signIn(persona.fileUploader);
  const fileId = await store(surface, "R-8.7 private.txt", content, []);
  await reads(surface, fileId, content);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await isRefused(surface, fileId);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await reads(surface, fileId, content);
});

test("a file is readable by anyone if it was marked readable by anyone", async ({ surface }) => {
  const content = `R-8.7 anyone ${Date.now()}`;

  await surface.signIn(persona.fileUploader);
  const fileId = await store(surface, "R-8.7 anyone.txt", content, [{ tag: "any" }]);
  await surface.signOut();

  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.readableWhenSignedOutIfPublic()).toBeTruthy();
  expect(await surface.fileDownload.fileContents()).toContain(content);
});

test("a file is readable by a person it names", async ({ surface }) => {
  const content = `R-8.7 named person ${Date.now()}`;

  await surface.signIn(persona.fileUploader);
  const fileId = await store(surface, "R-8.7 named person.txt", content, [
    { tag: "user", value: seed.users.vendorOne.id },
  ]);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await reads(surface, fileId, content);
  await surface.signOut();

  await surface.signIn(persona.organizationMember);
  await isRefused(surface, fileId);
});

test("a file is readable by anyone holding an account type it names", async ({ surface }) => {
  const content = `R-8.7 named account type ${Date.now()}`;

  await surface.signIn(persona.fileUploader);
  const fileId = await store(surface, "R-8.7 named account type.txt", content, [
    { tag: "userType", value: seed.users.staffOne.account_type },
  ]);
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await reads(surface, fileId, content);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await isRefused(surface, fileId);
});
