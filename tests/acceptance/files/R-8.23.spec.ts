// criterion: @R-8.23 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// A name of 256 characters, one over the limit, typed into the attachment control before
// the file goes anywhere. The message is asserted by the length it names rather than by
// its wording: what the criterion promises the person is told is the permitted length.
//
// The second half — an upload carrying no usable name at all failing instead as a fault
// of the service — is not asserted. Nothing in the surface submits a file without a name,
// and no observation reports a fault of the service as distinct from a refusal.
test("an upload whose name is longer than 255 characters is refused as a bad request, and the person is told the file name must be between 1 and 255 characters long", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.addAttachment({ file: "scan0001.pdf" });
  await surface.fileAttachmentControl.renameNewAttachment({ name: "n".repeat(256) });
  await surface.opportunityCwuCreate.saveDraft({ title: "Draft with an over-long attachment name" });

  const message = await surface.fileAttachmentControl.fileNameError();
  expect(message).toBeTruthy();
  expect(message).toContain("255");

  expect(await surface.fileAttachmentControl.existingAttachmentRow()).toBeFalsy();
});
