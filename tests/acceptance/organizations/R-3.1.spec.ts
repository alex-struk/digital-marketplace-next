// criterion: @R-3.1 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, seed } from "../../fixtures";

test("a visitor who is not signed in sees the two organizations that are not archived listed in alphabetical order by legal name, and the archived one is absent", async ({
  surface,
}) => {
  await surface.organizationList.open();

  const listed = await surface.organizationList.organizationName();

  expect(listed).toContain(seed.organizations.unqualified.legal_name);
  expect(listed).toContain(seed.organizations.qualified.legal_name);
  expect(listed).not.toContain(seed.organizations.archived.legal_name);

  // "Cedar Hollow Systems Inc." sorts before "Northern Pines Digital Ltd.".
  expect(listed.indexOf(seed.organizations.unqualified.legal_name)).toBeLessThan(
    listed.indexOf(seed.organizations.qualified.legal_name),
  );
});
