// criterion: @R-8.25 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// Two of the three read paths the criterion names can be walked: the creator's, before
// the opportunity is publicly visible, and everyone's, once it is. The third — a vendor
// refused the same attachment before publication — cannot be: a vendor cannot open an
// unpublished opportunity, and following a download offered on a screen is the only way a
// test reaches a file, since no observation returns a stored file's identifier.
test("an attachment on a Code With Us opportunity is readable by the opportunity's creator before it is publicly visible", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.addAttachment({ file: "background.pdf" });
  await surface.opportunityCwuCreate.saveDraft({ title: "Unpublished draft with an attachment" });

  expect(await surface.opportunityCwuEdit.summaryTab()).toBeTruthy();

  await surface.fileAttachmentControl.downloadAttachment({ name: "background.pdf" });
  expect(await surface.fileDownload.fileContents()).toBeTruthy();
});

// The proposal half of the criterion — an attachment on a proposal readable by whoever
// may read that proposal — is not asserted here for the same reason: the only person who
// can reach a proposal's attachments through the surface is the person who wrote it, and
// they are also the person who uploaded the file, so nothing that happens there tells the
// association apart from the uploader's own read access.
test("an attachment on a Code With Us opportunity is readable by anyone once that opportunity is publicly visible", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  await surface.fileAttachmentControl.open({
    program: "code-with-us",
    opportunity: seed.opportunities.publishedCodeWithUs.id,
  });
  await surface.fileAttachmentControl.addAttachment({ file: "published-background.pdf" });
  await surface.signOut();

  await surface.opportunityCwuView.open({ opportunity: seed.opportunities.publishedCodeWithUs.id });
  expect(await surface.fileAttachmentControl.attachmentListOnPublicView()).toContain("published-background.pdf");

  await surface.fileAttachmentControl.downloadAttachment({ name: "published-background.pdf" });
  expect(await surface.fileDownload.readableWhenSignedOutIfPublic()).toBeTruthy();
  expect(await surface.fileDownload.fileContents()).toBeTruthy();
});
