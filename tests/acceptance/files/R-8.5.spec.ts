// criterion: @R-8.5 v1
// provenance: blind, spec@ccc1cba3290f5ea17351e4f2ca49bd80fefc2ef6, derived 2026-09-29
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// Both uploaders are established as active accounts before either uploads, so neither upload
// can be turned away for anything but what it carries, and an upload that is not stored is
// reported by the refusal the service gave.
//
// Storing once is read from the stored content identifier the description carries, which is
// what two uploads of identical bytes share. Each upload being its own record is read from the
// two identifiers and names differing. Each record's own uploader and own read access are read
// through who may reach it: both files are marked readable by no one else, so each uploader
// reaching their own record and being refused the other's is what keeps the two apart — the
// description names no uploader, so this is the only way the uploader shows.
//
// The content carries the time so that the first upload here is the first of its content.

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

async function uploadAs(surface: Surface, who: Persona, name: string, content: string): Promise<string> {
  await surface.signIn(who);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({ name, content, readAccess: [] });
  const fileId = await readOrEmpty(() => surface.fileUpload.storedFileIdentifier());
  if (!fileId) throw new Error(`the upload of "${name}" was not stored: ${await refusalOf(surface)}`);
  return fileId;
}

test("two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access", async ({
  surface,
}) => {
  const content = `R-8.5 identical content ${Date.now()}`;
  const firstName = "quarterly-report.txt";
  const secondName = "copy-of-report.txt";

  await establishActive(surface, seed.users.fileUploader.id);
  await establishActive(surface, seed.users.vendorOne.id);

  const first = await uploadAs(surface, persona.fileUploader, firstName, content);
  await surface.fileDescription.open({ fileId: first });
  const storedContent = await surface.fileDescription.storedContentIdentifier();
  expect(storedContent).toBeTruthy();

  const second = await uploadAs(surface, persona.vendor, secondName, content);
  expect(second).not.toBe(first);

  await surface.fileDescription.open({ fileId: second });
  expect(await surface.fileDescription.fileName()).toBe(secondName);
  expect(await surface.fileDescription.storedContentIdentifier()).toBe(storedContent);

  await surface.fileDescription.open({ fileId: first });
  expect(await surface.fileDescription.refusedWhenNotPermitted()).toBeTruthy();

  await surface.signIn(persona.fileUploader);
  await surface.fileDescription.open({ fileId: first });
  expect(await surface.fileDescription.fileName()).toBe(firstName);

  await surface.fileDescription.open({ fileId: second });
  expect(await surface.fileDescription.refusedWhenNotPermitted()).toBeTruthy();
});
