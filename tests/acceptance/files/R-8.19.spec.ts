// criterion: @R-8.19 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// What is recorded against a file is not itself observable, so it is read by its consequence.
// An attachment on a draft opportunity — which a vendor may not read — is asked for directly
// by a vendor. Had the file been marked readable by anyone, or by vendors, they would receive
// it; with nothing recorded against it, only the opportunity decides, and it refuses them.
//
// The uploader reads the file first, which proves the identifier is a stored file's: for
// somebody who is not an administrator a missing file is refused in the same form (R-8.12).
// The program names come from the seed rather than being written out here.
function fileIdIn(address: string): string {
  return address.split("?")[0].split(/\//).filter(Boolean).pop() ?? "";
}

async function attachToDraft(surface: Surface, program: string, opportunityId: string, content: string): Promise<string> {
  const file = `R-8.19 ${program} attachment.pdf`;
  await surface.fileAttachmentControl.open({ program, opportunityId });
  await surface.fileAttachmentControl.addAttachment({ file, content });
  expect(await surface.fileAttachmentControl.existingAttachmentRow()).toContain(file);

  const fileId = fileIdIn(await surface.fileAttachmentControl.attachmentAddress());
  expect(fileId).toBeTruthy();

  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.fileContents()).toContain(content);
  return fileId;
}

async function refusedToAVendor(surface: Surface, fileId: string): Promise<void> {
  await surface.signOut();
  await surface.signIn(persona.vendor);
  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeTruthy();
}

test("an attachment on a Code With Us opportunity is uploaded with no read access recorded against the file itself, so that the opportunity decides who may read it", async ({
  surface,
}) => {
  const content = `R-8.19 code with us ${Date.now()}`;
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: "R-8.19 Code With Us draft with an attachment" });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();

  const fileId = await attachToDraft(surface, seed.opportunities.publishedCodeWithUs.program, opportunityId, content);

  await refusedToAVendor(surface, fileId);
});

test("an attachment on a Sprint With Us opportunity is uploaded with no read access recorded against the file itself, so that the opportunity decides who may read it", async ({
  surface,
}) => {
  const content = `R-8.19 sprint with us ${Date.now()}`;
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.saveDraft({ title: "R-8.19 Sprint With Us draft with an attachment" });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();

  const fileId = await attachToDraft(surface, seed.opportunities.closedSprintWithUs.program, opportunityId, content);

  await refusedToAVendor(surface, fileId);
});

test("an attachment on a Team With Us opportunity is uploaded with no read access recorded against the file itself, so that the opportunity decides who may read it", async ({
  surface,
}) => {
  const content = `R-8.19 team with us ${Date.now()}`;
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.saveDraft({ title: "R-8.19 Team With Us draft with an attachment" });
  const opportunityId = await surface.opportunityTwuEdit.opportunityIdentifier();

  const fileId = await attachToDraft(surface, seed.opportunities.closedTeamWithUs.program, opportunityId, content);

  await refusedToAVendor(surface, fileId);
});
