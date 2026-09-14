// criterion: @R-8.25 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Each read path is walked with a reader it alone can explain. A vendor is neither uploader
// nor administrator and is named by nothing on the file, so a vendor refused before
// publication and served after it is served by the opportunity's visibility. The creator path
// uses a draft one staff member created and an administrator attached to, so the creator is
// not the uploader. The proposal path uses the owner of the organization a proposal was
// offered for, who may read that proposal but did not write it or upload its attachment.
//
// The file is asked for by its own identifier, taken from the address the attachment control
// reports, since a person who may not read an opportunity has no screen to follow it from.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function fileIdIn(address: string): string {
  return address.split("?")[0].split(/\//).filter(Boolean).pop() ?? "";
}

const shared = {
  teaser: "A short summary of the work to be done.",
  location: "Victoria",
  description: "A full description of the work to be done.",
  remoteOk: true,
  remoteDescription: "Remote work is acceptable anywhere in the province.",
  proposalDeadline: inDays(14),
  assignmentDate: inDays(21),
  startDate: inDays(28),
  completionDate: inDays(90),
};

const codeWithUs = { ...shared, completionDate: inDays(35), reward: 5000, skills: ["Backend Development"] };

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function attach(surface: Surface, program: string, opportunityId: string, file: string, content: string): Promise<string> {
  await surface.fileAttachmentControl.open({ program, opportunityId });
  await surface.fileAttachmentControl.addAttachment({ file, content });
  expect(await surface.fileAttachmentControl.existingAttachmentRow()).toContain(file);
  const fileId = fileIdIn(await surface.fileAttachmentControl.attachmentAddress());
  expect(fileId).toBeTruthy();
  return fileId;
}

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

test("an attachment on a Code With Us opportunity is refused to a vendor before the opportunity is publicly visible, and readable by them once it is", async ({
  surface,
}) => {
  const program = seed.opportunities.publishedCodeWithUs.program;
  const content = `R-8.25 code with us ${Date.now()}`;

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...codeWithUs, title: "R-8.25 Code With Us draft published later" });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  const fileId = await attach(surface, program, opportunityId, "R-8.25 cwu.pdf", content);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await isRefused(surface, fileId);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityId });
  await surface.opportunityCwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await reads(surface, fileId, content);
});

test("an attachment on a Sprint With Us opportunity is refused to a vendor before the opportunity is publicly visible, and readable by them once it is", async ({
  surface,
}) => {
  const program = seed.opportunities.closedSprintWithUs.program;
  const content = `R-8.25 sprint with us ${Date.now()}`;

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 500000,
    capabilities: ["Frontend Development"],
  });
  await surface.opportunitySwuCreate.addTeamQuestion({
    question: "Describe how your team has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunitySwuCreate.setEvaluationPanel(panel);
  await surface.opportunitySwuCreate.saveDraft({
    ...shared,
    mandatorySkills: ["Frontend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
    title: "R-8.25 Sprint With Us draft published later",
  });
  const opportunityId = await surface.opportunitySwuEdit.opportunityIdentifier();
  const fileId = await attach(surface, program, opportunityId, "R-8.25 swu.pdf", content);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await isRefused(surface, fileId);
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunitySwuEdit.open({ opportunityId });
  await surface.opportunitySwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await reads(surface, fileId, content);
});

test("an attachment on an opportunity that is not yet publicly visible is readable by the opportunity's creator", async ({
  surface,
}) => {
  const program = seed.opportunities.publishedCodeWithUs.program;
  const content = `R-8.25 creator ${Date.now()}`;

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title: "R-8.25 draft another person attaches to" });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  const fileId = await attach(surface, program, opportunityId, "R-8.25 attached by an administrator.pdf", content);
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await reads(surface, fileId, content);
});

test("an attachment on a proposal is readable by whoever may read that proposal", async ({ surface }) => {
  const content = `R-8.25 proposal ${Date.now()}`;

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({ ...codeWithUs, title: "R-8.25 opportunity answered with an attachment" });
  const opportunityId = await surface.opportunityCwuEdit.opportunityIdentifier();
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentOrganization({ organization: seed.organizations.qualified });
  await surface.proposalCwuCreate.addAttachment({ file: "R-8.25 proposal attachment.pdf", content });
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
  await surface.proposalCwuEdit.open({ opportunityId, proposalId });
  expect(await surface.proposalCwuEdit.proposalIdentifier()).toBeTruthy();
  await reads(surface, fileId, content);
});
