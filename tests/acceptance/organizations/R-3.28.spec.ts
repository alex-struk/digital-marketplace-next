// criterion: @R-3.28 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given is an organization approved for two service areas: the seed's qualified
// organization, whose seed record names two. That the two approvals are in place is
// established before anything is edited rather than assumed, and where they are not, the
// administrator puts them in place first.
const organization = seed.organizations.qualified;
const kept = organization.service_areas[0];
const cleared = organization.service_areas[1];
// The third area to tick. No seed handle names the service areas the installation offers;
// this one is among those tests/seed/000-installation.sql puts in place, and neither of the
// qualified organization's own two.
const third = "DATA_PROFESSIONAL";

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

// A service area may be named by its code or by its label ("FULL_STACK_DEVELOPER" or "Full
// Stack Developer"), so it is matched on its words whichever way it is written.
function area(code: string): RegExp {
  return new RegExp(code.split("_").join("[\\s_-]*"), "i");
}

async function approvalsAsAdministrator(surface: Surface): Promise<string> {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  return readOrEmpty(() => surface.organizationEdit.serviceAreaCheckbox());
}

function approvedFor(approvals: string, codes: string[], not: string[]): boolean {
  return codes.every((code) => area(code).test(approvals)) && not.every((code) => !area(code).test(approvals));
}

async function establishTwoApprovals(surface: Surface): Promise<void> {
  if (!approvedFor(await approvalsAsAdministrator(surface), [kept, cleared], [third])) {
    await surface.organizationEdit.editServiceAreas();
    await surface.organizationEdit.saveServiceAreas({ serviceAreas: [kept, cleared] });
  }
  await expect
    .poll(async () => approvedFor(await approvalsAsAdministrator(surface), [kept, cleared], [third]), {
      message: `the organization does not stand approved for exactly ${kept} and ${cleared}`,
    })
    .toBe(true);
}

// The criterion promises that the owner is offered no editing control, not a message. A
// control that is not offered, or is offered and cannot be used, is that refusal, so an
// attempt the page does not let through is not itself a failure; what is asserted is that the
// approvals did not change.
async function attempt(action: () => Promise<void>): Promise<void> {
  await action().catch(() => undefined);
}

test("saving a selection of service areas replaces the organization's previous approvals entirely", async ({ surface }) => {
  await establishTwoApprovals(surface);

  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: organization.id });
  await surface.organizationEdit.editServiceAreas();
  await surface.organizationEdit.saveServiceAreas({ serviceAreas: [kept, third] });

  await expect
    .poll(async () => approvedFor(await approvalsAsAdministrator(surface), [kept, third], [cleared]), {
      message: `the organization is not approved for exactly ${kept} and ${third} once the save has completed`,
    })
    .toBe(true);
});

test("only an administrator may set which service areas an organization is approved for, not the organization's own owner", async ({
  surface,
}) => {
  await establishTwoApprovals(surface);

  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: organization.id });
  await attempt(() => surface.organizationEdit.editServiceAreas());
  await attempt(() => surface.organizationEdit.saveServiceAreas({ serviceAreas: [kept, third] }));

  expect(approvedFor(await approvalsAsAdministrator(surface), [kept, cleared], [third])).toBe(true);
});
