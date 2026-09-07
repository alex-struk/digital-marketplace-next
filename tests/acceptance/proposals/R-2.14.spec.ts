// criterion: @R-2.14 v2
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

const FUTURE_DEADLINE = "2030-06-01T23:59:00Z";

const completeIndividual = {
  legalName: "Robin Fielder",
  email: "robin.fielder@example.test",
  phone: "250 555 0100",
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
  await surface.proposalCwuCreate.acceptProgramTerms();
  await surface.proposalCwuCreate.acceptAppTerms();
}

async function submit(surface: Surface) {
  await surface.proposalCwuCreate.submitProposal({
    proposalText: "How we would do the work.",
    additionalComments: "Nothing further.",
  });
}

test("a Code With Us proponent who is a named individual is rejected when the legal name is missing", async ({
  surface,
}) => {
  await proposalReadyToSubmit(surface, "R-2.14 individual without a legal name");
  await surface.proposalCwuCreate.chooseProponentIndividual({
    ...completeIndividual,
    legalName: "",
  });
  await submit(surface);

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proponent who is a named individual is rejected when the postal address is incomplete", async ({
  surface,
}) => {
  await proposalReadyToSubmit(surface, "R-2.14 individual without an address");
  await surface.proposalCwuCreate.chooseProponentIndividual({
    ...completeIndividual,
    street1: "",
    city: "",
    region: "",
    mailCode: "",
    country: "",
  });
  await submit(surface);

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proponent who is a named individual is rejected when the email address or phone number is malformed", async ({
  surface,
}) => {
  await proposalReadyToSubmit(surface, "R-2.14 individual with a malformed email address");
  await surface.proposalCwuCreate.chooseProponentIndividual({
    ...completeIndividual,
    email: "not-an-email-address",
    phone: "not a phone number",
  });
  await submit(surface);

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});

test("a Code With Us proponent identified as an organization is checked only for existence and active status, not for the vendor's membership of it", async ({
  surface,
}) => {
  const title = "R-2.14 organization the vendor does not belong to";
  await proposalReadyToSubmit(surface, title);

  // This vendor is not a member of that organization.
  await surface.proposalCwuCreate.chooseProponentOrganization(seed.organizations.qualified);
  await submit(surface);

  await surface.proposalCwuEdit.open({ opportunityTitle: title });
  expect(await surface.proposalCwuEdit.status()).toContain("Submitted");
});

test("a Code With Us proponent identified as an organization is rejected when that organization is not active", async ({
  surface,
}) => {
  const title = "R-2.14 archived organization";
  await proposalReadyToSubmit(surface, title);

  await surface.proposalCwuCreate.chooseProponentOrganization(seed.organizations.archived);
  await submit(surface);

  expect(await surface.proposalCwuCreate.fieldError()).toBeTruthy();
});
