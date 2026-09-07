// criterion: @R-8.10 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The criterion's own example: a stored file named "terms.pdf" that the requester may
// read. It is reached the way the surface reaches any file — by following the download
// offered against the attachment — because no observation returns a stored file's
// identifier for it to be asked for directly.
//
// The content type is asserted by what it names rather than by an exact string: the
// criterion's claim is that the type is worked out from the name, and a type that names
// PDF for a file named "terms.pdf" is that claim. The uploaded bytes are deliberately not
// a PDF, so a type that matched the content rather than the name would not say PDF.
test("asking for a file with its content requested returns the bytes, described by a content type worked out from the file's name and offered to the browser as something to save rather than to display", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.addAttachment({ file: "terms.pdf", content: "plain text under a pdf name" });
  await surface.opportunityCwuCreate.saveDraft({ title: "Draft carrying a document to download" });

  await surface.fileAttachmentControl.downloadAttachment({ name: "terms.pdf" });

  expect(await surface.fileDownload.fileContents()).toBeTruthy();
  expect(await surface.fileDownload.fileNameOnSave()).toContain("terms.pdf");
  expect((await surface.fileDownload.contentTypeFromName()).toLowerCase()).toContain("pdf");
  expect(await surface.fileDownload.offeredAsDownloadNotDisplayed()).toBeTruthy();
});
