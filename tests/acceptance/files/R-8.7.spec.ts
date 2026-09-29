// criterion: @R-8.7 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion's own example comes first: a file one vendor stored and marked readable by no
// one else, refused to a second vendor and received by an administrator, and received by the
// vendor who uploaded it. Each of the other ways of being allowed that the criterion names is
// then walked on its own, with somebody the statement does not reach refused beside somebody it
// does, so that each grant is seen to be the reason and not a wider default.
//
// Every vendor account a test uploads or reads as is established as active before it starts,
// so a refusal can only be about read access, and an upload that is not stored is reported by
// the refusal the service gave rather than read as an empty identifier.
//
// A named person and a named account type are taken from the seed: the vendor persona's own
// account, and the account type the seeded public sector staff member holds.

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

// Stored by the file-uploader, who is signed in on return.
async function store(surface: Surface, name: string, content: string, readAccess: unknown[]): Promise<string> {
  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({ name, content, readAccess });
  const fileId = await readOrEmpty(() => surface.fileUpload.storedFileIdentifier());
  if (!fileId) throw new Error(`the upload of "${name}" was not stored: ${await refusalOf(surface)}`);
  return fileId;
}

async function reads(surface: Surface, fileId: string, content: string): Promise<void> {
  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await readOrEmpty(() => surface.fileDownload.refusedWhenNotPermitted())).toBeFalsy();
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
  await establishActive(surface, seed.users.fileUploader.id, seed.users.vendorOne.id);

  const fileId = await store(surface, "private-notes.txt", content, []);
  await reads(surface, fileId, content);

  await surface.signIn(persona.vendor);
  await isRefused(surface, fileId);

  await surface.signIn(persona.administrator);
  await reads(surface, fileId, content);
});

test("a file is readable by anyone if it was marked readable by anyone", async ({ surface }) => {
  const content = `R-8.7 anyone ${Date.now()}`;
  await establishActive(surface, seed.users.fileUploader.id);

  const fileId = await store(surface, "public-notice.txt", content, [{ tag: "any" }]);
  await surface.signOut();

  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.readableWhenSignedOutIfPublic()).toBeTruthy();
  expect(await surface.fileDownload.fileContents()).toContain(content);
});

test("a file is readable by a person it names", async ({ surface }) => {
  const content = `R-8.7 named person ${Date.now()}`;
  await establishActive(
    surface,
    seed.users.fileUploader.id,
    seed.users.vendorOne.id,
    seed.users.organizationMember.id,
  );

  const fileId = await store(surface, "for-one-vendor.txt", content, [
    { tag: "user", value: seed.users.vendorOne.id },
  ]);

  await surface.signIn(persona.vendor);
  await reads(surface, fileId, content);

  await surface.signIn(persona.organizationMember);
  await isRefused(surface, fileId);
});

test("a file is readable by anyone holding an account type it names", async ({ surface }) => {
  const content = `R-8.7 named account type ${Date.now()}`;
  await establishActive(surface, seed.users.fileUploader.id, seed.users.staffOne.id, seed.users.vendorOne.id);

  const fileId = await store(surface, "for-public-sector.txt", content, [
    { tag: "userType", value: seed.users.staffOne.account_type },
  ]);

  await surface.signIn(persona.publicSectorStaff);
  await reads(surface, fileId, content);

  await surface.signIn(persona.vendor);
  await isRefused(surface, fileId);
});
