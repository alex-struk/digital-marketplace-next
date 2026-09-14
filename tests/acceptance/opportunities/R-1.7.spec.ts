// criterion: @R-1.7 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// The refusal is read afterwards by an administrator, because an administrator is the one
// person certain to see an opportunity whatever state it reached. If the attempt had been
// allowed, the title would stand somewhere on the administrator's dashboard; that it does
// not is the whole of "no opportunity is created".

test("an anonymous visitor's attempt to create an opportunity is refused and no opportunity is created", async ({
  surface,
}) => {
  const title = "R-1.7 opportunity an anonymous visitor tried to create";

  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });

  await surface.signIn(persona.administrator);
  await surface.opportunityDashboard.open();
  expect(await surface.opportunityDashboard.allOpportunitiesForAdministrator()).not.toContain(title);
});

test("a vendor's attempt to create an opportunity is refused and no opportunity is created", async ({
  surface,
}) => {
  const title = "R-1.7 opportunity a vendor tried to create";

  await surface.signIn(persona.vendor);
  await surface.opportunityCwuCreate.open();
  await surface.opportunityCwuCreate.saveDraft({ title });
  await surface.signOut();

  await surface.signIn(persona.administrator);
  await surface.opportunityDashboard.open();
  expect(await surface.opportunityDashboard.allOpportunitiesForAdministrator()).not.toContain(title);
});
