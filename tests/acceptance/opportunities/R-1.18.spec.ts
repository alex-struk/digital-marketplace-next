// criterion: @R-1.18 v1
// provenance: blind, spec@7a0d47692af14ab67cbbdeb0e701a6cf71199a60, derived 2026-09-11
import { test, expect, persona } from "../../fixtures";

// Each resource is well formed but for the one thing the criterion bounds. The allocations
// taken are the two values just outside the range rather than values far outside it, so a
// form that bounded the allocation somewhere else would not satisfy them.

const sound = { serviceArea: "Full Stack Developer", targetAllocation: 100 };

test("a Team With Us resource whose target allocation is below one per cent is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({ ...sound, targetAllocation: 0 });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us resource whose target allocation is above one hundred per cent is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({ ...sound, targetAllocation: 101 });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});

test("a Team With Us resource naming a service area the service does not recognise is rejected", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.opportunityTwuCreate.open();
  await surface.opportunityTwuCreate.addResource({
    ...sound,
    serviceArea: "Lighthouse Keeper",
  });
  expect(await surface.opportunityTwuCreate.fieldError()).toBeTruthy();
});
