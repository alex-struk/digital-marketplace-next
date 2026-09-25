// criterion: @R-3.20 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Being refused and being answered with an empty list are different answers, and the page for
// the organizations one may act on behalf of reads the refusal on its own. Anyone who is not a
// signed-in vendor is a visitor who is not signed in, a member of public sector staff or a
// service administrator.

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function askedForOrganizationsActingFor(surface: Surface): Promise<string> {
  await surface.organizationActingForList.open();
  return readOrEmpty(() => surface.organizationActingForList.refusedWhenNotPermitted());
}

test("asking for the organizations one may act on behalf of is refused as not permitted for a visitor who is not signed in, rather than answered with an empty list", async ({
  surface,
}) => {
  expect(await askedForOrganizationsActingFor(surface)).toBeTruthy();
});

test("asking for the organizations one may act on behalf of is refused as not permitted for a member of public sector staff, rather than answered with an empty list", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);
  expect(await askedForOrganizationsActingFor(surface)).toBeTruthy();
});

test("asking for the organizations one may act on behalf of is refused as not permitted for a service administrator, rather than answered with an empty list", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  expect(await askedForOrganizationsActingFor(surface)).toBeTruthy();
});
