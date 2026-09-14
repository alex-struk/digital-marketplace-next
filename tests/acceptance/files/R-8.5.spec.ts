// criterion: @R-8.5 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// Storing once is read from the stored content identifier the description carries, which is
// what two uploads of identical bytes share. Each upload being its own record is read from
// the two identifiers and names differing. Its own uploader and its own read access are read
// together as refusals: both files are marked readable by no one else, so each uploader
// reaching their own record and being refused the other's is what keeps the two apart.
//
// The content carries the time so that the first upload here is the first of its content.
test("two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access", async ({
  surface,
}) => {
  const content = `R-8.5 identical content ${Date.now()}`;
  const firstName = "R-8.5 first upload.txt";
  const secondName = "R-8.5 second upload.txt";

  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({ name: firstName, content, readAccess: [] });
  const first = await surface.fileUpload.storedFileIdentifier();
  expect(first).toBeTruthy();

  await surface.fileDescription.open({ fileId: first });
  const storedContent = await surface.fileDescription.storedContentIdentifier();
  expect(storedContent).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({ name: secondName, content, readAccess: [] });
  const second = await surface.fileUpload.storedFileIdentifier();
  expect(second).toBeTruthy();
  expect(second).not.toBe(first);

  await surface.fileDescription.open({ fileId: second });
  expect(await surface.fileDescription.fileName()).toBe(secondName);
  expect(await surface.fileDescription.storedContentIdentifier()).toBe(storedContent);

  await surface.fileDescription.open({ fileId: first });
  expect(await surface.fileDescription.refusedWhenNotPermitted()).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.fileUploader);
  await surface.fileDescription.open({ fileId: first });
  expect(await surface.fileDescription.fileName()).toBe(firstName);

  await surface.fileDescription.open({ fileId: second });
  expect(await surface.fileDescription.refusedWhenNotPermitted()).toBeTruthy();
});
