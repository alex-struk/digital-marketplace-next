// criterion: @R-8.20 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// A Code With Us attachment is the one case where the outcome cannot be reached any other
// way: nothing is recorded against the file itself, so a vendor who receives it received
// it by way of the opportunity it hangs on. The seeded published opportunity is the
// vehicle because it is the only opportunity a vendor can open by a handle the seed
// carries.
//
// The Sprint With Us and Team With Us halves of the claim are not asserted. The seed holds
// no opportunity in either program, and an opportunity a test builds cannot then be opened
// by anybody else: the opportunity list offers no action that opens one of its rows, and
// no observation returns the identifier of an opportunity just created, so a vendor has no
// way to reach it. The proposal half is not asserted either — no screen offers a
// proposal's attachments to the person who may read the proposal but did not write it.
test("a file attached to an opportunity or a proposal is readable by whoever may read the thing it is attached to, under one rule covering Code With Us, Sprint With Us and Team With Us alike rather than a separate rule per program", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.fileAttachmentControl.open({
    program: "code-with-us",
    opportunity: seed.opportunities.publishedCodeWithUs.id,
  });
  await surface.fileAttachmentControl.addAttachment({ file: "requirements.pdf" });
  expect(await surface.fileAttachmentControl.existingAttachmentRow()).toContain("requirements.pdf");
  await surface.signOut();

  // A vendor may read this opportunity, so a vendor may read what is attached to it.
  await surface.signIn(persona.vendor);
  await surface.opportunityCwuView.open({ opportunity: seed.opportunities.publishedCodeWithUs.id });

  expect(await surface.fileAttachmentControl.attachmentListOnPublicView()).toContain("requirements.pdf");

  await surface.fileAttachmentControl.downloadAttachment({ name: "requirements.pdf" });
  expect(await surface.fileDownload.fileContents()).toBeTruthy();
});
