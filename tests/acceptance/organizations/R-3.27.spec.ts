// criterion: @R-3.27 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("the owner reading the Sprint With Us terms and accepting them has the acceptance recorded with its date", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);

  // Read on the qualification page while the terms stand unaccepted. The reading after
  // acceptance is told apart from this one rather than merely being non-empty; what the
  // page calls either state is its own business.
  await surface.organizationEdit.open({ orgId: seed.organizations.unqualified.id });
  const termsUnaccepted = await surface.organizationEdit.swuRequirementTermsAccepted();

  await surface.organizationSwuTerms.open({ orgId: seed.organizations.unqualified.id });
  await surface.organizationSwuTerms.acceptTerms();

  expect(await surface.organizationSwuTerms.acceptedOnNotice()).toBeTruthy();

  await surface.organizationEdit.open({ orgId: seed.organizations.unqualified.id });
  expect(await surface.organizationEdit.swuRequirementTermsAccepted()).not.toBe(termsUnaccepted);
});

test("a second attempt to accept the same terms for the same organization is refused", async ({ surface }) => {
  await surface.signIn(persona.vendor);
  await surface.organizationSwuTerms.open({ orgId: seed.organizations.unqualified.id });
  const firstAcceptance = await surface.organizationSwuTerms.acceptedOnNotice();

  await surface.organizationSwuTerms.acceptTerms();

  // Nothing further is recorded: the acceptance still shows the date of the first one.
  expect(await surface.organizationSwuTerms.acceptedOnNotice()).toBe(firstAcceptance);
});
