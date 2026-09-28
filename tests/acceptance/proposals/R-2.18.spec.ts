// criterion: @R-2.18 v3
// provenance: blind, spec@c1e09955fdff55e84870c25dfcb8e0fd9981c437, derived 2026-09-28
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The criterion says neither refusal can be reached through the proposal form, because the
// form offers only the organization's active members. One of them can still be reached
// without it: a draft is saved naming a person while they are an active member, the person
// is then removed from the organization, and the draft is submitted from its own management
// screen. At that moment the proposal names somebody whose membership is absent, which is
// the given, and the service is what weighs it.
//
// The proposal is a Team With Us one for the qualified organization, whose qualification for
// that program rests on its terms and its service areas rather than on its headcount, so
// removing one member leaves nothing out of place but the named team member. A second draft,
// on a second opportunity of the same shape, names a person who stays a member; it is
// submitted the same way, so a refusal of the first cannot be the management screen failing
// to submit anything at all.
//
// The management screen names no error, so the refusal is read as the proposal keeping the
// status it had before it was submitted. The wording of the refusal, the Team With Us refusal
// of the same person named twice, the absence of that check in a Sprint With Us phase, and
// what the form offers are recorded in not-testable.yaml.

const statement =
  "Every person named on a proposal's team must be an active member of the organization the proposal is submitted for, and the service refuses anyone else";

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishTeamOpportunity(surface: Surface, title: string): Promise<string> {
  await surface.signIn(persona.administrator);
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
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 1000000,
    questionsWeight: 40,
    challengeWeight: 40,
    priceWeight: 20,
    title,
  });
  const opportunityId = await surface.opportunityTwuEdit.opportunityIdentifier();
  await surface.signOut();
  return opportunityId;
}

async function saveDraftNaming(
  surface: Surface,
  opportunityId: string,
  member: unknown,
): Promise<string> {
  await surface.proposalTwuCreate.open({ opportunityId });
  await surface.proposalTwuCreate.chooseOrganization({ organization: seed.organizations.qualified });
  await surface.proposalTwuCreate.addTeamMemberForResource({
    resource: "Full Stack Developer",
    member,
  });
  await surface.proposalTwuCreate.setHourlyRate({ resource: "Full Stack Developer", rate: 100 });
  await surface.proposalTwuCreate.answerResourceQuestion({
    order: 0,
    response: "Our developer built and ran the same kind of service for a Crown corporation.",
  });
  await surface.proposalTwuCreate.acceptProgramTerms();
  await surface.proposalTwuCreate.acceptAppTerms();
  await surface.proposalTwuCreate.saveDraft();
  return surface.proposalTwuEdit.proposalIdentifier();
}

async function statusOf(surface: Surface, opportunityId: string, proposalId: string): Promise<string> {
  await surface.proposalTwuEdit.open({ opportunityId, proposalId });
  return surface.proposalTwuEdit.status();
}

async function submitDraft(surface: Surface, opportunityId: string, proposalId: string): Promise<void> {
  await surface.proposalTwuEdit.open({ opportunityId, proposalId });
  try {
    await surface.proposalTwuEdit.submitProposal();
  } catch {
    // A submission the screen will not carry out has been refused; the status says so below.
  }
}

test(`${statement} (a person no longer a member of the organization)`, async ({ surface }) => {
  test.setTimeout(300000);
  const departing = await publishTeamOpportunity(
    surface,
    "R-2.18 opportunity bid on naming a person who then leaves the organization",
  );
  const staying = await publishTeamOpportunity(
    surface,
    "R-2.18 opportunity bid on naming a person who stays in the organization",
  );

  await surface.signIn(persona.organizationAdmin);
  const departingProposal = await saveDraftNaming(surface, departing, seed.users.organizationMember);
  const draftStatus = await surface.proposalTwuEdit.status();
  const stayingProposal = await saveDraftNaming(surface, staying, seed.users.organizationAdmin);

  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.removeTeamMember({ member: seed.users.organizationMember });

  await submitDraft(surface, staying, stayingProposal);
  expect(
    await statusOf(surface, staying, stayingProposal),
    "a draft naming only active members is submitted from the management screen",
  ).not.toBe(draftStatus);

  await submitDraft(surface, departing, departingProposal);
  expect(
    await statusOf(surface, departing, departingProposal),
    "the draft naming a person who is no longer a member was submitted",
  ).toBe(draftStatus);
});
