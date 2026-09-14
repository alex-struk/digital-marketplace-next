// criterion: @R-8.20 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// One rule, walked once per program: an administrator publishes an opportunity and attaches a
// file to it, and a vendor — who did not upload it, is not an administrator and is named by
// nothing on the file — reads it because they may read the opportunity. The same is walked
// for a proposal: a Code With Us proposal offered on behalf of the seeded qualified
// organization is read by that organization's owner, who may read the proposal but did not
// write it or upload its attachment.
//
// The Sprint With Us and Team With Us proposal cases are not asserted. Both proposal forms
// accept an attachment, but the attachment control — the only thing that reports a stored
// attachment's address — is listed on the three opportunity forms and the Code With Us
// proposal form only, so a file attached to either of those proposals cannot be asked for.

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

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishCodeWithUs(surface: Surface, title: string): Promise<string> {
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    ...shared,
    completionDate: inDays(35),
    reward: 5000,
    skills: ["Backend Development"],
    title,
  });
  return surface.opportunityCwuEdit.opportunityIdentifier();
}

async function publishSprintWithUs(surface: Surface, title: string): Promise<string> {
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
  await surface.opportunitySwuCreate.publish({
    ...shared,
    mandatorySkills: ["Frontend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
    title,
  });
  return surface.opportunitySwuEdit.opportunityIdentifier();
}

async function publishTeamWithUs(surface: Surface, title: string): Promise<string> {
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    serviceArea: "Full Stack Developer",
    targetAllocation: 100,
    order: 0,
  });
  await surface.opportunityTwuCreate.addResourceQuestion({
    question: "Describe how your resource has delivered work of this kind before.",
    guideline: "Answer with one worked example.",
    score: 20,
    wordLimit: 300,
    order: 0,
  });
  await surface.opportunityTwuCreate.setEvaluationPanel(panel);
  await surface.opportunityTwuCreate.publish({
    ...shared,
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    title,
  });
  return surface.opportunityTwuEdit.opportunityIdentifier();
}

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

test("a file attached to a Code With Us opportunity is readable by whoever may read the opportunity", async ({
  surface,
}) => {
  const content = `R-8.20 code with us ${Date.now()}`;
  await surface.signIn(persona.administrator);
  const opportunityId = await publishCodeWithUs(surface, "R-8.20 Code With Us opportunity with an attachment");
  const fileId = await attach(surface, seed.opportunities.publishedCodeWithUs.program, opportunityId, "R-8.20 cwu.pdf", content);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await reads(surface, fileId, content);
});

test("a file attached to a Sprint With Us opportunity is readable by whoever may read the opportunity, under the same rule", async ({
  surface,
}) => {
  const content = `R-8.20 sprint with us ${Date.now()}`;
  await surface.signIn(persona.administrator);
  const opportunityId = await publishSprintWithUs(surface, "R-8.20 Sprint With Us opportunity with an attachment");
  const fileId = await attach(surface, seed.opportunities.closedSprintWithUs.program, opportunityId, "R-8.20 swu.pdf", content);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await reads(surface, fileId, content);
});

test("a file attached to a Team With Us opportunity is readable by whoever may read the opportunity, under the same rule", async ({
  surface,
}) => {
  const content = `R-8.20 team with us ${Date.now()}`;
  await surface.signIn(persona.administrator);
  const opportunityId = await publishTeamWithUs(surface, "R-8.20 Team With Us opportunity with an attachment");
  const fileId = await attach(surface, seed.opportunities.closedTeamWithUs.program, opportunityId, "R-8.20 twu.pdf", content);
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await reads(surface, fileId, content);
});

test("a file attached to a proposal is readable by whoever may read the proposal", async ({ surface }) => {
  const content = `R-8.20 proposal ${Date.now()}`;
  await surface.signIn(persona.administrator);
  const opportunityId = await publishCodeWithUs(surface, "R-8.20 Code With Us opportunity answered with an attachment");
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.proposalCwuCreate.open({ opportunityId });
  await surface.proposalCwuCreate.chooseProponentOrganization({ organization: seed.organizations.qualified });
  await surface.proposalCwuCreate.addAttachment({ file: "R-8.20 proposal attachment.pdf", content });
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
