// criterion: @R-2.25 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const PASSED_DEADLINE = "2020-01-15T23:59:00Z";
const SUBMITTED_PROPONENT = "Robin Fielder";
const DRAFT_PROPONENT = "Sam Harbour";

function individual(legalName: string) {
  return {
    legalName,
    email: "robin.fielder@example.test",
    street1: "1 Front Street",
    city: "Victoria",
    region: "British Columbia",
    mailCode: "V8V 1V1",
    country: "Canada",
  };
}

// Created by public sector staff and published by an administrator, so the opportunity
// has an author who is not the administrator reading it.
async function opportunityWithOneSubmittedAndOneDraft(surface: Surface, title: string) {
  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.submitForReview({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    reward: 5000,
    proposalDeadline: FUTURE_DEADLINE,
    remoteOk: true,
  });

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  await surface.opportunityCwuEdit.publish();

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  await surface.proposalCwuCreate.chooseProponentIndividual(individual(SUBMITTED_PROPONENT));
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "How we would do the work.",
    additionalComments: "Nothing further.",
  });

  await surface.signIn(persona.fileUploader);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  await surface.proposalCwuCreate.chooseProponentIndividual(individual(DRAFT_PROPONENT));
  await surface.proposalCwuCreate.saveDraft({ proposalText: "Still working on this." });
}

async function letTheDeadlinePass(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  await surface.opportunityCwuEdit.editDetails({ proposalDeadline: PASSED_DEADLINE });
  // The transitions that follow a passed deadline run in front of the next request.
  await surface.opportunityList.open();
}

test("public sector staff cannot see any proposal against an opportunity until that opportunity has closed", async ({
  surface,
}) => {
  const title = "R-2.25 proposals before the opportunity closes";
  await opportunityWithOneSubmittedAndOneDraft(surface, title);

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  expect(await surface.opportunityCwuEdit.proposalsTab()).not.toContain(SUBMITTED_PROPONENT);

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  expect(await surface.opportunityCwuEdit.proposalsTab()).not.toContain(SUBMITTED_PROPONENT);
});

test("once the opportunity has closed, staff see the proposals submitted against it", async ({
  surface,
}) => {
  const title = "R-2.25 proposals after the opportunity closes";
  await opportunityWithOneSubmittedAndOneDraft(surface, title);
  await letTheDeadlinePass(surface, title);

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });

  expect(await surface.opportunityCwuEdit.proposalsTab()).toContain(SUBMITTED_PROPONENT);
});

test("staff never see drafts or unsubmitted proposals", async ({ surface }) => {
  const title = "R-2.25 drafts are never listed";
  await opportunityWithOneSubmittedAndOneDraft(surface, title);
  await letTheDeadlinePass(surface, title);

  await surface.signIn(persona.publicSectorStaff);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  expect(await surface.opportunityCwuEdit.proposalsTab()).not.toContain(DRAFT_PROPONENT);

  await surface.signIn(persona.administrator);
  await surface.opportunityCwuEdit.open({ opportunityTitle: title });
  expect(await surface.opportunityCwuEdit.proposalsTab()).not.toContain(DRAFT_PROPONENT);
});
