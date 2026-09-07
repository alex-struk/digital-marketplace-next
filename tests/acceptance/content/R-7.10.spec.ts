// criterion: @R-7.10 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona, seed } from "../../fixtures";

// Each of the three actors the criterion names asks for the two screens through which a
// page is created, changed or removed, and the seeded page is read afterwards to show that
// nothing about it moved.
const attempted = "Wording nobody without permission should be able to leave behind.";

test("a signed-in vendor asking the service to create, change or remove a page is refused, and nothing is created, changed or removed", async ({
  surface,
}) => {
  await surface.signIn(persona.vendor);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A page a vendor tried to make" });
  await surface.contentCreate.enterSlug({ slug: "a-page-a-vendor-tried-to-make" });
  await surface.contentCreate.enterBody({ body: attempted });
  await surface.contentCreate.publishPage();
  expect(await surface.contentCreate.refusedForNonAdministrator()).toBeTruthy();

  await surface.contentEdit.open({ slug: seed.content.ordinaryPage.slug });
  expect(await surface.contentEdit.refusedForNonAdministrator()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: "a-page-a-vendor-tried-to-make" });
  expect(await surface.contentView.notFoundForUnknownAddress()).toBeTruthy();

  await surface.contentView.open({ slug: seed.content.ordinaryPage.slug });
  expect(await surface.contentView.pageTitle()).toBe(seed.content.ordinaryPage.title);
  expect(await surface.contentView.pageBody()).not.toContain(attempted);
});

test("a signed-in public sector employee asking the service to create, change or remove a page is refused, and nothing is created, changed or removed", async ({
  surface,
}) => {
  await surface.signIn(persona.publicSectorStaff);

  await surface.contentCreate.open();
  await surface.contentCreate.enterTitle({ title: "A page an employee tried to make" });
  await surface.contentCreate.enterSlug({ slug: "a-page-an-employee-tried-to-make" });
  await surface.contentCreate.enterBody({ body: attempted });
  await surface.contentCreate.publishPage();
  expect(await surface.contentCreate.refusedForNonAdministrator()).toBeTruthy();

  await surface.contentEdit.open({ slug: seed.content.ordinaryPage.slug });
  expect(await surface.contentEdit.refusedForNonAdministrator()).toBeTruthy();

  await surface.signOut();
  await surface.contentView.open({ slug: "a-page-an-employee-tried-to-make" });
  expect(await surface.contentView.notFoundForUnknownAddress()).toBeTruthy();

  await surface.contentView.open({ slug: seed.content.ordinaryPage.slug });
  expect(await surface.contentView.pageTitle()).toBe(seed.content.ordinaryPage.title);
});

test("a visitor who is not signed in asking the service to create, change or remove a page is refused, and nothing is created, changed or removed", async ({
  surface,
}) => {
  await surface.contentCreate.open();
  expect(await surface.contentCreate.refusedForNonAdministrator()).toBeTruthy();

  await surface.contentEdit.open({ slug: seed.content.ordinaryPage.slug });
  expect(await surface.contentEdit.refusedForNonAdministrator()).toBeTruthy();

  await surface.contentView.open({ slug: seed.content.ordinaryPage.slug });
  expect(await surface.contentView.pageTitle()).toBe(seed.content.ordinaryPage.title);
});
