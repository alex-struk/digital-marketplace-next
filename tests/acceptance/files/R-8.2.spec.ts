// criterion: @R-8.2 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// One submission, three parts. Two of them a test can supply: the file itself and the
// name to store it under both go to the attachment control. The third — the statement of
// who may read it — is settled by the form on the person's behalf; nothing in the surface
// states it separately and no observation reports it back, so it is present here only in
// that the upload succeeds at all.
//
// Of the record the criterion says comes back, only the name is observable. Neither the
// identifier nor the date it was stored is returned by any observation, so what is
// asserted is that the file is stored under the name it was given and can be fetched
// again by that name.
test("an upload carries the file itself, a name to store it under, and a statement of who may read it, all in one submission", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.addAttachment({ file: "terms-of-reference.pdf" });
  await surface.opportunityCwuCreate.saveDraft({ title: "Draft carrying one attachment" });

  expect(await surface.fileAttachmentControl.existingAttachmentRow()).toContain("terms-of-reference.pdf");

  await surface.fileAttachmentControl.downloadAttachment({ name: "terms-of-reference.pdf" });
  expect(await surface.fileDownload.fileContents()).toBeTruthy();
});
