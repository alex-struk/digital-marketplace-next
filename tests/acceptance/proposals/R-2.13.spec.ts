// criterion: @R-2.13 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";
const TOO_LONG = "a".repeat(10001);

const individualProponent = {
  legalName: "Robin Fielder",
  email: "robin.fielder@example.test",
  street1: "1 Front Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V8V 1V1",
  country: "Canada",
};

async function proposalReadyToSubmit(surface: Surface, title: string) {
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    reward: 5000,
    proposalDeadline: FUTURE_DEADLINE,
    remoteOk: true,
  });

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  await surface.proposalCwuCreate.chooseProponentIndividual(individualProponent);
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
}

test("a Code With Us proposal that is not a draft is rejected when its proposal text is empty", async ({
  surface,
}) => {
  const title = "R-2.13 empty proposal text";
  await proposalReadyToSubmit(surface, title);

  await surface.proposalCwuCreate.submitProposal({
    proposalText: "",
    additionalComments: "Nothing further.",
  });

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proposal that is not a draft is rejected when its proposal text is longer than 10,000 characters", async ({
  surface,
}) => {
  const title = "R-2.13 overlong proposal text";
  await proposalReadyToSubmit(surface, title);

  await surface.proposalCwuCreate.submitProposal({
    proposalText: TOO_LONG,
    additionalComments: "Nothing further.",
  });

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proposal that is not a draft is rejected when its additional comments are longer than 10,000 characters", async ({
  surface,
}) => {
  const title = "R-2.13 overlong additional comments";
  await proposalReadyToSubmit(surface, title);

  await surface.proposalCwuCreate.submitProposal({
    proposalText: "How we would do the work.",
    additionalComments: TOO_LONG,
  });

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proposal that is not a draft is rejected unless it carries a complete proponent", async ({
  surface,
}) => {
  const title = "R-2.13 incomplete proponent";
  await surface.signIn(persona.administrator);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.publish({
    title,
    teaser: "A short description of the work.",
    description: "The work to be done, in full.",
    reward: 5000,
    proposalDeadline: FUTURE_DEADLINE,
    remoteOk: true,
  });

  await surface.signIn(persona.vendor);
  await surface.proposalCwuCreate.open({ opportunityTitle: title });
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
  // No proponent is chosen at all.
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "How we would do the work.",
    additionalComments: "Nothing further.",
  });

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proposal carrying proposal text within the limit, comments within the limit and a complete proponent is accepted", async ({
  surface,
}) => {
  const title = "R-2.13 within the limits";
  await proposalReadyToSubmit(surface, title);

  await surface.proposalCwuCreate.submitProposal({
    proposalText: "How we would do the work.",
    additionalComments: "Nothing further.",
  });

  await surface.proposalCwuEdit.open({ opportunityTitle: title });
  expect(await surface.proposalCwuEdit.status()).toContain("Submitted");
});
