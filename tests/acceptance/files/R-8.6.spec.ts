// criterion: @R-8.6 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// When is read directly: the description names the date the file was stored, and it must
// fall around the moment the upload was made. Who is not — observables.yaml records that the
// description names no uploader — so it is read as what being the uploader grants: a file
// marked readable by no one else stays readable by the person who stored it and by nobody
// else who is not an administrator.
//
// Unchangeable is read across the one later event that touches the same stored content: a
// second person uploading byte-for-byte identical content. Afterwards the first record still
// carries its own date and name, is still readable by its uploader, and has not become the
// second person's.
const FIVE_MINUTES = 5 * 60 * 1000;

test("every stored file records who uploaded it and when, and neither can be changed afterwards", async ({
  surface,
}) => {
  const content = `R-8.6 content ${Date.now()}`;
  const name = "R-8.6 kept as uploaded.txt";

  const before = Date.now();
  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({ name, content, readAccess: [] });
  const fileId = await surface.fileUpload.storedFileIdentifier();
  const after = Date.now();
  expect(fileId).toBeTruthy();

  await surface.fileDescription.open({ fileId });
  const storedDate = await surface.fileDescription.storedDate();
  const storedAt = Date.parse(storedDate);
  expect(Number.isNaN(storedAt)).toBe(false);
  expect(storedAt).toBeGreaterThanOrEqual(before - FIVE_MINUTES);
  expect(storedAt).toBeLessThanOrEqual(after + FIVE_MINUTES);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.fileDescription.open({ fileId });
  expect(await surface.fileDescription.refusedWhenNotPermitted()).toBeTruthy();

  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({
    name: "R-8.6 identical copy.txt",
    content,
    readAccess: [],
  });
  expect(await surface.fileUpload.storedFileIdentifier()).toBeTruthy();

  await surface.fileDescription.open({ fileId });
  expect(await surface.fileDescription.refusedWhenNotPermitted()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.fileUploader);
  await surface.fileDescription.open({ fileId });
  expect(await surface.fileDescription.storedDate()).toBe(storedDate);
  expect(await surface.fileDescription.fileName()).toBe(name);
});
