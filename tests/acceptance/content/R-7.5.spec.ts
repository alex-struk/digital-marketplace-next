// criterion: @R-7.5 v1
// provenance: blind, spec@40605384759bd10724c1411fdc448dfd99c70aee, derived 2026-09-07
import { test, expect, persona } from "../../fixtures";

test("the list of pages names every page with its title, its public address, whether the service needs it, and when it was created and last updated, ordered by title", async ({
  surface,
}) => {
  await surface.signIn(persona.administrator);

  await surface.contentList.open();

  expect(await surface.contentList.pageTitle()).toBeTruthy();
  expect(await surface.contentList.pagePublicAddress()).toBeTruthy();
  expect(await surface.contentList.pageIsFixed()).toBeTruthy();
  expect(await surface.contentList.pageCreatedDate()).toBeTruthy();
  expect(await surface.contentList.pageUpdatedDate()).toBeTruthy();
  expect(await surface.contentList.orderedByTitle()).toBeTruthy();
});

test("only an administrator can see the list of pages", async ({ surface }) => {
  await surface.signIn(persona.vendor);

  await surface.contentList.open();

  expect(await surface.contentList.refusedForNonAdministrator()).toBeTruthy();
});
