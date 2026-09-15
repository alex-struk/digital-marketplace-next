// criterion: @R-3.28 v1
// provenance: blind, spec@2d9a83e439479b419845aa46aa7d9d819b38de24, derived 2026-09-14
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is the seed's qualified organization, approved for exactly two service areas. The
// target is put back to that seed before every test. No seed record or contract entry names a
// third service area, so the criterion's third tick is not made; clearing one of the two and
// saving is what tells a save that replaces the approvals from one that adds to them, because
// addition would leave the cleared area in place.
const organization = seed.organizations.qualified;
const kept = organization.service_areas[0];
const cleared = organization.service_areas[1];

async function approvalsRead(surface: Surface): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.serviceAreaCheckbox()).toContain(kept);
  return surface.organizationEdit.serviceAreaCheckbox();
}

async function administratorKeepsOnlyOne(surface: Surface): Promise<void> {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await expect.poll(() => surface.organizationEdit.serviceAreaCheckbox()).toContain(cleared);
  expect(await surface.organizationEdit.serviceAreaCheckbox()).toContain(kept);

  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [kept] });
}

// The criterion promises that the owner is offered no editing control, not a message. An
// attempt the page does not let through is that refusal, so it is not itself a failure; what
// is asserted is that the approvals did not change.
async function attempt(action: Promise<void>): Promise<void> {
  await action.catch(() => undefined);
}

test("saving a selection of service areas replaces the organization's previous approvals entirely", async ({ surface }) => {
  await administratorKeepsOnlyOne(surface);

  expect(await approvalsRead(surface)).not.toContain(cleared);
});

test("only an administrator may set which service areas an organization is approved for, not the organization's own owner", async ({
  surface,
}) => {
  await administratorKeepsOnlyOne(surface);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(surface.organizationEdit.editServiceAreas());
  await attempt(surface.organizationEdit.saveServiceAreas({ serviceAreas: [cleared] }));

  expect(await approvalsRead(surface)).not.toContain(cleared);
});
