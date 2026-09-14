// criterion: @R-8.31 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each read path is first shown to be open for somebody the association alone explains — a
// vendor on a published opportunity, the creator of a draft somebody else attached to, the
// owner of the organization a proposal was offered for — and then shown to be closed for the
// same person once the association is gone. The file is asked for by its own identifier,
// since once the attachment or its record is gone no screen offers it.
//
// Deleting a proposal is not walked: only a draft proposal can be deleted, and nothing states
// that a draft is readable by anyone but its author and administrators, so there is no reader
// whose access could be seen to be withdrawn. The second half of the criterion — a file no
// record refers to any longer being identifiable as detached — is not asserted either: no
// observation on the file's description, its download or anywhere else reports whether a
// stored file is still referred to.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function fileIdIn(address: string): string {
  return address.split("?")[0].split(/\//).filter(Boolean).pop() ?? "";
}

const codeWithUs = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  reward: 5000,
  skills: ["Backend Development"],
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(35),
};

const program = seed.opportunities.publishedCodeWithUs.program;

async function reads(surface: Surface, fileId: string, content: string): Promise<void> {
  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeFalsy();
  expect(await surface.fileDownload.fileContents()).toContain(content);
}

async function isRefused(surface: Surface, fileId: string): Promise<void> {
  await surface.fileDownload.open({ fileId });
  await surface.fileDownload.downloadFile();
  expect(await surface.fileDownload.refusedWhenNotPermitted()).toBeTruthy();
}

test("removing an attachment from an opportunity withdraws the read path the file held through that opportunity", async ({
  surface,
}) => {
  const file = "R-8.31 removed from an opportunity.pdf";
  const content = `R-8.31 removed from an opportunity ${Date.now()}`;

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...codeWithUs, title: "R-8.31 opportunity losing an attachment" });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.fileAttachmentControl.open({ program, opportunityId });
  await surface.fileAttachmentControl.addAttachment({ file, content });
  const fileId = fileIdIn(await surface.fileAttachmentControl.attachmentAddress());
  expect(fileId).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await reads(surface, fileId, content);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.fileAttachmentControl.open({ program, opportunityId });
  await surface.fileAttachmentControl.removeExistingAttachment({ name: file });
  expect(await surface.fileAttachmentControl.existingAttachmentRow()).not.toContain(file);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await isRefused(surface, fileId);
});

test("deleting the opportunity an attachment hangs on withdraws the read path the file held through that opportunity", async ({
  surface,
}) => {
  const content = `R-8.31 opportunity deleted ${Date.now()}`;

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: "R-8.31 draft deleted with its attachment" });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.fileAttachmentControl.open({ program, opportunityId });
  await surface.fileAttachmentControl.addAttachment({ file: "R-8.31 on a deleted draft.pdf", content });
  const fileId = fileIdIn(await surface.fileAttachmentControl.attachmentAddress());
  expect(fileId).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await reads(surface, fileId, content);

  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.deleteOpportunity();

  await isRefused(surface, fileId);
});

test("removing an attachment from a proposal withdraws the read path the file held through that proposal", async ({
  surface,
}) => {
  const file = "R-8.31 removed from a proposal.pdf";
  const content = `R-8.31 removed from a proposal ${Date.now()}`;

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...codeWithUs, title: "R-8.31 opportunity whose proposal loses an attachment" });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentOrganization({ organization: seed.organizations.qualified });
  await surface.proposalCwuCreate.addAttachment({ file, content });
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A proposal offered on behalf of an organization, with a document attached.",
  });
  const proposalId = await surface.proposalCwuEdit.proposalIdentifier();
  const fileId = fileIdIn(await surface.fileAttachmentControl.attachmentAddress());
  expect(fileId).toBeTruthy();
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await reads(surface, fileId, content);
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.proposalCwuEdit.open({ opportunityId, proposalId });
  await surface.proposalCwuEdit.startEditing();
  await surface.proposalCwuEdit.removeAttachment({ name: file });
  await surface.proposalCwuEdit.saveChanges();
  await surface.signOut();

  await surface.signIn(persona.organizationOwner);
  await isRefused(surface, fileId);
});
