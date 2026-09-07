// criterion: @R-3.11 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("when an administrator tries to end the sole owner's membership the request is refused and the membership remains", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.removeTeamMember({ member: seed.users.organizationOwner });

  expect(await surface.organizationEdit.fieldError()).toBeTruthy();
  expect(await surface.organizationEdit.ownerBadge()).toBeTruthy();
});
