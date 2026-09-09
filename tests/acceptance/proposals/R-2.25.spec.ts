// criterion: @R-2.25 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-08
import { test, expect, persona, seed } from "../../fixtures";

// The opportunity is written by a member of public sector staff and published by an
// administrator, so that both readers the criterion names are on it: its own author and an
// administrator. It carries one submitted proposal and one draft, from two different
// vendors, which is the given.
//
// The other half — that once the opportunity has closed the list shows the submitted
// proposals but never the drafts — is not asserted. An opportunity leaves the published
// state by closing at its proposal deadline, and no page, action or observation makes a
// deadline pass or closes one by hand (see R-1.1). Before it closes everything is withheld
// alike, so the drafts cannot be shown to be withheld for a reason of their own.

function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const details = {
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

test("public sector staff and administrators cannot see any proposal against an opportunity until that opportunity has closed", async ({
  surface,
}) => {
  const title = "R-2.25 opportunity whose proposals are withheld while it is open";

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ ...details, title });
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.submitForReview();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ title });
  await surface.opportunityCwuEdit.publish();
  await surface.signOut();

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "A submitted proposal the opportunity's author may not yet read.",
  });
  await surface.signOut();

  await surface.signIn(persona.organizationAdmin);
  await surface.proposalCwuCreate.open({ opportunity: title });
  await surface.proposalCwuCreate.chooseProponentIndividual();
  await surface.proposalCwuCreate.saveDraft({
    proposalText: "A draft proposal the opportunity's author may never read.",
  });
  await surface.signOut();

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ title });
  expect(await surface.opportunityCwuEdit.proposalsTab()).toBeFalsy();
  await surface.proposalCwuView.open({ opportunity: title, author: seed.users.vendorOne.id });
  expect(await surface.proposalCwuView.proposalTab()).toBeFalsy();
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ title });
  expect(await surface.opportunityCwuEdit.proposalsTab()).toBeFalsy();
  await surface.proposalCwuView.open({ opportunity: title, author: seed.users.vendorOne.id });
  expect(await surface.proposalCwuView.proposalTab()).toBeFalsy();
});
