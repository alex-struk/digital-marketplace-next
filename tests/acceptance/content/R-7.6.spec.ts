// criterion: @R-7.6 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// The half about the navigation menu is not asserted: no surface names the menu, and no
// observation reports what routes it offers, so "no route is offered to them" has nothing
// to be read from. What is asserted is the consequence the criterion turns on — reaching
// each of the three managing screens directly and being shown the not-found screen.
test("a signed-in vendor who reaches any of the managing screens directly is shown the not-found screen", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);

  await surface.contentList.open();
  expect(await surface.contentList.refusedForNonAdministrator()).toBeTruthy();

  await surface.contentCreate.open();
  expect(await surface.contentCreate.refusedForNonAdministrator()).toBeTruthy();

  await surface.contentEdit.open({ slug: seed.content.ordinaryPage.slug });
  expect(await surface.contentEdit.refusedForNonAdministrator()).toBeTruthy();
});

test("a signed-in public sector employee who reaches any of the managing screens directly is shown the not-found screen", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);

  await surface.contentList.open();
  expect(await surface.contentList.refusedForNonAdministrator()).toBeTruthy();

  await surface.contentCreate.open();
  expect(await surface.contentCreate.refusedForNonAdministrator()).toBeTruthy();

  await surface.contentEdit.open({ slug: seed.content.ordinaryPage.slug });
  expect(await surface.contentEdit.refusedForNonAdministrator()).toBeTruthy();
});
