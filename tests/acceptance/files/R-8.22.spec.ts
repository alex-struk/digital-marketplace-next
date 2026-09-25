// criterion: @R-8.22 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The refused attempt names seed.stored_files.privateOfFileUploader, which carries no read
// access and so is readable by its uploader alone. Somebody else names it by its identifier
// as an attachment on something they may edit: their own draft opportunity, or their own
// draft proposal. The accepted counterpart has the same person, on the same record, name a
// file they stored themselves and so may read. That pairing is what shows the refusal comes
// from read permission on the file and not from attaching by identifier at all.

const privateFile = seed.stored_files.privateOfFileUploader;

async function storeOwnFile(surface: Surface, name: string): Promise<string> {
  await surface.fileUpload.open();
  await surface.fileUpload.uploadFileStatingItsReadAccess({ name, content: `${name} ${Date.now()}`, readAccess: [] });
  const fileId = await surface.fileUpload.storedFileIdentifier();
  expect(fileId).toBeTruthy();
  return fileId;
}

async function ownDraftOpportunity(surface: Surface): Promise<string> {
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: `R-8.22 draft opportunity ${Date.now()}` });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  expect(opportunityId).toBeTruthy();
  return opportunityId;
}

async function ownDraftProposal(surface: Surface): Promise<string> {
  await surface.proposalCwuCreate.open({ opportunityId: seed.opportunities.publishedCodeWithUs.id });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({ proposalText: "A draft proposal a stored file is named on." });
  const proposalId = await surface.proposalCwuEdit.proposalIdentifier();
  expect(proposalId).toBeTruthy();
  return proposalId;
}

test("a file may be attached to an opportunity only by someone who is permitted to read that file: someone who may not read it is refused", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  const recordId = await ownDraftOpportunity(surface);

  await surface.fileAttachByIdentifier.open({
    recordKind: "opportunities",
    program: seed.opportunities.publishedCodeWithUs.program,
    recordId,
  });
  await surface.fileAttachByIdentifier.attachStoredFile({ fileId: privateFile.id });

  expect(await surface.fileAttachByIdentifier.attachmentRefused()).toBeTruthy();
  expect(await surface.fileAttachByIdentifier.attachmentAccepted()).toBeFalsy();
  expect(await surface.fileAttachByIdentifier.attachedFileIdentifiers()).not.toContain(privateFile.id);
});

test("a file may be attached to an opportunity only by someone who is permitted to read that file: someone who may read it is allowed", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  const fileId = await storeOwnFile(surface, "R-8.22 opportunity attachment.txt");
  const recordId = await ownDraftOpportunity(surface);

  await surface.fileAttachByIdentifier.open({
    recordKind: "opportunities",
    program: seed.opportunities.publishedCodeWithUs.program,
    recordId,
  });
  await surface.fileAttachByIdentifier.attachStoredFile({ fileId });

  expect(await surface.fileAttachByIdentifier.attachmentRefused()).toBeFalsy();
  expect(await surface.fileAttachByIdentifier.attachmentAccepted()).toBeTruthy();
  expect(await surface.fileAttachByIdentifier.attachedFileIdentifiers()).toContain(fileId);
});

test("a file may be attached to a proposal only by someone who is permitted to read that file: someone who may not read it is refused", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  const recordId = await ownDraftProposal(surface);

  await surface.fileAttachByIdentifier.open({
    recordKind: "proposals",
    program: seed.opportunities.publishedCodeWithUs.program,
    recordId,
  });
  await surface.fileAttachByIdentifier.attachStoredFile({ fileId: privateFile.id });

  expect(await surface.fileAttachByIdentifier.attachmentRefused()).toBeTruthy();
  expect(await surface.fileAttachByIdentifier.attachmentAccepted()).toBeFalsy();
  expect(await surface.fileAttachByIdentifier.attachedFileIdentifiers()).not.toContain(privateFile.id);
});

test("a file may be attached to a proposal only by someone who is permitted to read that file: someone who may read it is allowed", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);
  const fileId = await storeOwnFile(surface, "R-8.22 proposal attachment.txt");
  const recordId = await ownDraftProposal(surface);

  await surface.fileAttachByIdentifier.open({
    recordKind: "proposals",
    program: seed.opportunities.publishedCodeWithUs.program,
    recordId,
  });
  await surface.fileAttachByIdentifier.attachStoredFile({ fileId });

  expect(await surface.fileAttachByIdentifier.attachmentRefused()).toBeFalsy();
  expect(await surface.fileAttachByIdentifier.attachmentAccepted()).toBeTruthy();
  expect(await surface.fileAttachByIdentifier.attachedFileIdentifiers()).toContain(fileId);
});
