// criterion: @R-8.10 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona } from "../../fixtures";

// The criterion's own example: a stored file named "terms.pdf" that the requester may read,
// here because they stored it. The bytes are deliberately not a PDF, so a content type that
// names PDF can only have been worked out from the name and not from the content. The type is
// asserted by what it names rather than by an exact string.
test("asking for a file with its content requested returns the bytes, described by a content type worked out from the file's name and offered to the browser as something to save rather than to display", async ({
  surface,
}) => {
  const content = `R-8.10 plain text under a pdf name ${Date.now()}`;

  await surface.signIn(persona.fileUploader);
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({ name: "terms.pdf", content, readAccess: [] });
  const fileId = await surface.fileUpload.storedFileIdentifier();
  expect(fileId).toBeTruthy();

  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();

  expect(await surface.fileDownload.fileContents()).toContain(content);
  expect((await surface.fileDownload.contentTypeFromName()).toLowerCase()).toContain("pdf");
  expect(await surface.fileDownload.fileNameOnSave()).toContain("terms.pdf");
  expect(await surface.fileDownload.offeredAsDownloadNotDisplayed()).toBeTruthy();
});
