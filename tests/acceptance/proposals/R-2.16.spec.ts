// criterion: @R-2.16 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The organization with the outstanding invitation is the unqualified one these tests bid
// for: its Sprint With Us terms were never accepted and it has a single active member, so
// it fails the qualification test twice over. That member is its owner, who also owns the
// qualified organization and holds the one capability the phase asks for, so the same
// vendor can offer the same complete team on behalf of either organization and nothing but
// the organization named differs between the two proposals.
//
// The criterion's given — an organization that has since lost its qualified status —
// cannot be produced: qualification is two active members holding every capability the
// service recognises plus accepted terms, and no action takes any of those away again.
// The second test therefore reads the re-check the other way round, which the surface can
// reach: two complete drafts alike but for the organization each names are saved, and then
// submitted, and only the one naming the qualified organization becomes submitted. What
// the refusal says is not read, because the proposal management screen carries no
// observation that names an error; the qualified draft submitting from the same page in
// the same breath is what tells the qualification check apart from any other refusal.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type Organization =
  | typeof seed.organizations.qualified
  | typeof seed.organizations.withPendingInvitation;

const panel = {
  members: [seed.users.staffOne, seed.users.staffPanelEvaluator],
  chair: seed.users.staffPanelEvaluator,
};

async function publishSprintOpportunity(surface: Surface, title: string): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.opportunitySwuCreate.open();
  await surface.opportunitySwuCreate.addPhase({
    phase: "Implementation",
    startDate: inDays(28),
    completionDate: inDays(90),
    maxBudget: 500000,
    capabilities: ["Backend Development"],
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
    teaser: "A short summary of the work to be done.",
    location: "Victoria",
    description: "A full description of the work to be done.",
    remoteOk: true,
    remoteDescription: "Remote work is acceptable anywhere in the province.",
    proposalDeadline: inDays(14),
    assignmentDate: inDays(21),
    startDate: inDays(28),
    completionDate: inDays(90),
    mandatorySkills: ["Backend Development"],
    totalMaxBudget: 500000,
    questionsWeight: 25,
    codeChallengeWeight: 25,
    teamScenarioWeight: 25,
    priceWeight: 25,
    title,
  });
  await surface.signOut();
}

async function answerAndReference(surface: Surface): Promise<void> {
  await surface.proposalSwuCreate.answerTeamQuestion({
    order: 0,
    response: "We delivered a scheduling service for a health authority over eighteen months.",
  });
  for (const order of [0, 1, 2]) {
    await surface.proposalSwuCreate.addReference({
      order,
      name: `Reference ${order + 1}`,
      company: "Reference Company Ltd.",
      phone: "250-555-0101",
      email: `reference.${order + 1}@example.test`,
    });
  }
  await surface.proposalSwuCreate.acceptProgramTerms();
  await surface.proposalSwuCreate.acceptAppTerms();
}

// A proposal that wants for nothing: the phase has a team and a scrum master, the member
// named holds the capability the phase asks for, and the cost sits under the phase budget.
// The only thing that varies between the proposals below is the organization named.
async function fillProposal(
  surface: Surface,
  opportunity: string,
  organization: Organization,
): Promise<void> {
  await surface.proposalSwuCreate.open({ opportunity });
  await surface.proposalSwuCreate.chooseOrganization({ organization });
  await surface.proposalSwuCreate.addPhaseTeamMember({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setScrumMaster({
    phase: "Implementation",
    member: seed.users.organizationOwner,
  });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
  await answerAndReference(surface);
}

test("a Sprint With Us proposal may only be submitted on behalf of an organization that is a qualified supplier for that program", async ({
  surface,
}) => {
  const title = "R-2.16 opportunity bid on by an unqualified organization";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.organizationOwner);
  await fillProposal(surface, title, seed.organizations.withPendingInvitation);
  await surface.proposalSwuCreate.submitProposal();

  await surface.proposalVendorDashboard.open();
  await surface.proposalVendorDashboard.showMyProposals();
  expect(await surface.proposalVendorDashboard.myProposalsTable()).not.toContain(title);
});

test("the organization a Sprint With Us proposal names is re-checked at the moment of submission", async ({
  surface,
}) => {
  const refused = "R-2.16 opportunity whose unqualified draft is submitted later";
  const accepted = "R-2.16 opportunity whose qualified draft is submitted later";
  await publishSprintOpportunity(surface, refused);
  await publishSprintOpportunity(surface, accepted);

  await surface.signIn(persona.organizationOwner);

  await fillProposal(surface, refused, seed.organizations.withPendingInvitation);
  await surface.proposalSwuCreate.saveDraft();
  await surface.proposalSwuEdit.open({ opportunity: refused });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("draft");
  await surface.proposalSwuEdit.submitProposal();
  await surface.proposalSwuEdit.open({ opportunity: refused });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("draft");

  await fillProposal(surface, accepted, seed.organizations.qualified);
  await surface.proposalSwuCreate.saveDraft();
  await surface.proposalSwuEdit.open({ opportunity: accepted });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("draft");
  await surface.proposalSwuEdit.submitProposal();
  await surface.proposalSwuEdit.open({ opportunity: accepted });
  expect((await surface.proposalSwuEdit.status()).toLowerCase()).toContain("submitted");
});

test("a Sprint With Us proposal naming no organization at all is refused", async ({ surface }) => {
  const title = "R-2.16 opportunity bid on with no organization named";
  await publishSprintOpportunity(surface, title);

  await surface.signIn(persona.vendor);
  await surface.proposalSwuCreate.open({ opportunity: title });
  await surface.proposalSwuCreate.setPhaseProposedCost({ phase: "Implementation", cost: 400000 });
  await answerAndReference(surface);
  await surface.proposalSwuCreate.submitProposal();

  expect((await surface.proposalSwuCreate.fieldError()).toLowerCase()).toContain(
    "organization must be specified",
  );
});
