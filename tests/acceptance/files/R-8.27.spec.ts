// criterion: @R-8.27 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

// The criterion's own example: "scan0001.pdf" renamed to "Statement of work", with the
// ending left off, and stored as "Statement of work.pdf". The rename happens while the
// attachment is still only listed on the form, which is the "before it is uploaded" the
// criterion turns on; that an attachment already stored can no longer be renamed is read
// back after the save as the other side of the same claim.
test("an attachment can be given a different display name before it is uploaded, and the ending of the original file is put back on if the person leaves it off", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.addAttachment({ file: "scan0001.pdf" });
  expect(await surface.fileAttachmentControl.newAttachmentRow()).toContain("scan0001.pdf");

  await surface.fileAttachmentControl.renameNewAttachment({ name: "Statement of work" });
  expect(await surface.fileAttachmentControl.originalExtensionRestored()).toBeTruthy();

  await surface.opportunityCwuCreate.saveDraft({ title: "Draft with a renamed attachment" });

  const stored = await surface.fileAttachmentControl.existingAttachmentRow();
  expect(stored).toContain("Statement of work.pdf");
  expect(stored).not.toContain("scan0001");
  expect(await surface.fileAttachmentControl.existingAttachmentNameReadOnly()).toBeTruthy();
});
