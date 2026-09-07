// criterion: @R-3.33 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

test("after administrator rights are granted to a member and then withdrawn, the changelog shows \"Admin Rights Removed\" above \"Admin Rights Given\"", async ({
  surface,
}) => {
  await surface.signIn(persona.organizationOwner);
  await surface.organizationEdit.open({ orgId: seed.organizations.qualified.id });
  await surface.organizationEdit.acceptOrgAdminTerms();
  await surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationMember });
  await surface.organizationEdit.toggleMemberAdminStatus({ member: seed.users.organizationMember });

  const changelog = await surface.organizationEdit.changelogEntry();
  expect(changelog).toContain("Admin Rights Removed");
  expect(changelog).toContain("Admin Rights Given");
  expect(changelog.indexOf("Admin Rights Removed")).toBeLessThan(changelog.indexOf("Admin Rights Given"));
});
