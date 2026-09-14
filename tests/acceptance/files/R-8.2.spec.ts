// criterion: @R-8.2 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// One submission carrying all three parts — the bytes, the name and the read-access
// statement — and the record the criterion says comes back is read in full from the
// description of the stored file: its identifier, its name and the date it was stored.
test("an upload carries the file itself, a name to store it under, and a statement of who may read it, all in one submission", async ({
  surface,
}) => {
  const name = "R-8.2 terms-of-reference.pdf";

  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({
    name,
    content: `R-8.2 one submission ${Date.now()}`,
    readAccess: [{ tag: "any" }],
  });

  const fileId = await surface.fileUpload.storedFileIdentifier();
  expect(fileId).toBeTruthy();

  await surface.fileDescription.open({ fileId });
  expect(await surface.fileDescription.fileIdentifier()).toBe(fileId);
  expect(await surface.fileDescription.fileName()).toBe(name);
  expect(await surface.fileDescription.storedDate()).toBeTruthy();
});
